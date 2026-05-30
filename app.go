package main

import (
	"context"
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"Shunnel/internal/core"
	"Shunnel/internal/model"
	"Shunnel/internal/ping"
	"Shunnel/internal/platform"
	"Shunnel/internal/store"
)

// LogEntry is a single sing-box log line sent to the frontend.
type LogEntry struct {
	Level   string `json:"level"`
	Message string `json:"message"`
}

// TrafficUpdate is emitted on the "traffic:update" event every second.
type TrafficUpdate struct {
	UpTotal   int64 `json:"upTotal"`
	DownTotal int64 `json:"downTotal"`
	UpRate    int64 `json:"upRate"`
	DownRate  int64 `json:"downRate"`
}

// App is the Wails application backend.
type App struct {
	ctx    context.Context
	store  *store.Store
	engine *core.Engine

	mu     sync.Mutex
	status ConnStatus

	trayReady atomic.Bool
	quitting  atomic.Bool

	logMu  sync.RWMutex
	logBuf []LogEntry

	trafficCancel context.CancelFunc
}

// NewApp creates a new App application struct.
func NewApp() *App {
	return &App{
		engine: core.New(),
		status: ConnStatus{State: "disconnected"},
	}
}

// startup is called when the app starts. The context is saved so we can call
// the Wails runtime methods (events, logging, ...) later.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	path, err := platform.ConfigFile()
	if err != nil {
		runtime.LogError(ctx, fmt.Sprintf("resolve config path: %v", err))
		return
	}
	st, err := store.Open(path)
	if err != nil {
		runtime.LogError(ctx, fmt.Sprintf("open config store: %v", err))
		return
	}
	a.store = st
	runtime.LogInfo(ctx, fmt.Sprintf("config loaded from %s", path))

	// Capture sing-box log lines and push them to the frontend.
	a.engine.SetLogCallback(func(level, msg string) {
		e := LogEntry{Level: level, Message: msg}
		a.logMu.Lock()
		a.logBuf = append(a.logBuf, e)
		if len(a.logBuf) > 500 {
			a.logBuf = a.logBuf[1:]
		}
		a.logMu.Unlock()
		if a.ctx != nil {
			runtime.EventsEmit(a.ctx, "log:entry", e)
		}
	})

	a.startTray()
}

// beforeClose hides the window to the tray instead of quitting, when the tray
// is available. Returning true cancels the window close. If the tray failed to
// initialise, the close proceeds normally so the app can still be quit.
func (a *App) beforeClose(ctx context.Context) bool {
	if a.quitting.Load() {
		return false // an explicit quit (tray menu / close prompt) — allow it
	}
	if !a.trayReady.Load() {
		return false // no tray available — close normally
	}
	// Ask the frontend whether to quit or minimise to tray, and cancel this
	// close for now (the user's choice triggers QuitApp or HideToTray).
	runtime.EventsEmit(ctx, "close:requested")
	return true
}

// HideToTray hides the window (chosen from the close prompt).
func (a *App) HideToTray() {
	if a.ctx != nil {
		runtime.WindowHide(a.ctx)
	}
}

// QuitApp quits the whole application (from the tray menu or the close prompt).
func (a *App) QuitApp() {
	a.quitting.Store(true)
	if a.ctx != nil {
		runtime.Quit(a.ctx)
	}
}

// shutdown stops the tunnel (which also unsets the system proxy) on exit.
func (a *App) shutdown(_ context.Context) {
	a.stopTrafficPoller()
	_ = a.engine.Stop()
}

// startTrafficPoller begins emitting "traffic:update" events every second.
// A prior poller (if any) is stopped first.
func (a *App) startTrafficPoller() {
	a.stopTrafficPoller()
	ctx, cancel := context.WithCancel(context.Background())
	a.trafficCancel = cancel
	go func() {
		ticker := time.NewTicker(time.Second)
		defer ticker.Stop()
		var prevUp, prevDown int64
		for {
			select {
			case <-ctx.Done():
				if a.ctx != nil {
					runtime.EventsEmit(a.ctx, "traffic:update", TrafficUpdate{})
				}
				return
			case <-ticker.C:
				up, down := a.engine.TrafficTotal()
				if a.ctx != nil {
					runtime.EventsEmit(a.ctx, "traffic:update", TrafficUpdate{
						UpTotal:  up,
						DownTotal: down,
						UpRate:   max(int64(0), up-prevUp),
						DownRate:  max(int64(0), down-prevDown),
					})
				}
				prevUp, prevDown = up, down
			}
		}
	}()
}

func (a *App) stopTrafficPoller() {
	if a.trafficCancel != nil {
		a.trafficCancel()
		a.trafficCancel = nil
	}
}

// GetLogs returns the buffered sing-box log lines (up to 500 most recent).
func (a *App) GetLogs() []LogEntry {
	a.logMu.RLock()
	defer a.logMu.RUnlock()
	cp := make([]LogEntry, len(a.logBuf))
	copy(cp, a.logBuf)
	return cp
}

// AppInfo is basic metadata shown in the UI.
type AppInfo struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

// GetAppInfo returns static app metadata (bound to the frontend).
func (a *App) GetAppInfo() AppInfo {
	return AppInfo{Name: "Shunnel", Version: "0.1.0-dev"}
}

// ---- Server profiles ----

// GetServers returns all SSH server profiles (secrets stripped).
func (a *App) GetServers() []model.ServerProfile {
	if a.store == nil {
		return []model.ServerProfile{}
	}
	return a.store.Servers()
}

// AddServer stores a new SSH server profile and returns it (secrets stripped).
func (a *App) AddServer(p model.ServerProfile) (model.ServerProfile, error) {
	if a.store == nil {
		return model.ServerProfile{}, fmt.Errorf("store not ready")
	}
	return a.store.AddServer(p)
}

// UpdateServer updates an existing profile. Empty secret fields keep the
// previously stored values.
func (a *App) UpdateServer(p model.ServerProfile) error {
	if a.store == nil {
		return fmt.Errorf("store not ready")
	}
	return a.store.UpdateServer(p)
}

// DeleteServer removes a profile by id.
func (a *App) DeleteServer(id string) error {
	if a.store == nil {
		return fmt.Errorf("store not ready")
	}
	return a.store.DeleteServer(id)
}

// ---- Ping ----

// PingResult is returned by PingServer and emitted on the "ping:update" event.
type PingResult struct {
	ID  string `json:"id"`
	Ms  int    `json:"ms"`
	OK  bool   `json:"ok"`
	Err string `json:"err,omitempty"`
}

// pingTimeout bounds a single TCP reachability probe to the SSH port.
const pingTimeout = 5 * time.Second

// PingServer probes a single server via TCP and returns its SSH-port latency.
func (a *App) PingServer(id string) PingResult {
	if a.store == nil {
		return PingResult{ID: id, OK: false, Err: "store not ready"}
	}
	host, port, ok := a.store.Endpoint(id)
	if !ok {
		return PingResult{ID: id, OK: false, Err: "server not found"}
	}
	r := ping.TCP(host, port, pingTimeout)
	return PingResult{ID: id, Ms: r.Ms, OK: r.OK, Err: r.Err}
}

// PingAll probes every server concurrently, emitting a "ping:update" event per
// server as each result arrives.
func (a *App) PingAll() {
	if a.store == nil {
		return
	}
	var wg sync.WaitGroup
	for _, p := range a.store.Servers() {
		wg.Add(1)
		go func(p model.ServerProfile) {
			defer wg.Done()
			r := ping.TCP(p.Host, p.Port, pingTimeout)
			runtime.EventsEmit(a.ctx, "ping:update", PingResult{
				ID: p.ID, Ms: r.Ms, OK: r.OK, Err: r.Err,
			})
		}(p)
	}
	wg.Wait()
}

// ---- Connection ----

// ConnStatus is the current tunnel state, emitted on the "status:change" event.
type ConnStatus struct {
	State    string `json:"state"` // disconnected | connecting | connected | error
	ServerID string `json:"serverId,omitempty"`
	Error    string `json:"error,omitempty"`
}

func (a *App) setStatus(s ConnStatus) {
	a.mu.Lock()
	a.status = s
	a.mu.Unlock()
	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, "status:change", s)
	}
}

// GetStatus returns the current connection status.
func (a *App) GetStatus() ConnStatus {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.status
}

// Connect starts the tunnel. selection is a server id to pin, or "auto" for
// latency-based selection with automatic failover.
func (a *App) Connect(selection string) error {
	if a.store == nil {
		return fmt.Errorf("store not ready")
	}
	servers := a.store.ServersWithSecrets()
	if len(servers) == 0 {
		return fmt.Errorf("no servers configured")
	}
	a.setStatus(ConnStatus{State: "connecting", ServerID: selection})
	_ = a.engine.Stop() // replace any existing tunnel
	cfg := core.BuildConfig(a.store.Proxy(), servers, selection, a.store.Tun())
	if err := a.engine.Start(cfg); err != nil {
		a.stopTrafficPoller()
		a.setStatus(ConnStatus{State: "error", ServerID: selection, Error: err.Error()})
		return err
	}
	_ = a.store.SetActiveServer(selection)
	a.setStatus(ConnStatus{State: "connected", ServerID: selection})
	a.startTrafficPoller()
	return nil
}

// Disconnect stops the tunnel.
func (a *App) Disconnect() error {
	a.stopTrafficPoller()
	err := a.engine.Stop()
	a.setStatus(ConnStatus{State: "disconnected"})
	return err
}

// ---- Proxy settings ----

// GetProxySettings returns the current local-proxy settings.
func (a *App) GetProxySettings() model.ProxySettings {
	if a.store == nil {
		return model.DefaultConfig().Proxy
	}
	return a.store.Proxy()
}

// SetProxySettings persists the local-proxy settings. Changes take effect on
// the next Connect.
func (a *App) SetProxySettings(p model.ProxySettings) error {
	if a.store == nil {
		return fmt.Errorf("store not ready")
	}
	return a.store.SetProxy(p)
}

// GetProxyEndpoint returns the resolved "host:port" the proxy listens on.
func (a *App) GetProxyEndpoint() string {
	return core.ListenEndpoint(a.GetProxySettings())
}

// ---- TUN ----

// GetTunSettings returns the current TUN settings.
func (a *App) GetTunSettings() model.TunSettings {
	if a.store == nil {
		return model.DefaultConfig().Tun
	}
	return a.store.Tun()
}

// SetTunSettings persists the TUN settings. Changes take effect on the next
// Connect.
func (a *App) SetTunSettings(t model.TunSettings) error {
	if a.store == nil {
		return fmt.Errorf("store not ready")
	}
	return a.store.SetTun(t)
}

// ListProcesses returns the names of currently running executables, for the
// TUN app picker.
func (a *App) ListProcesses() []string {
	return platform.ListProcesses()
}

// IsAdmin reports whether the app is running with administrator privileges
// (required for TUN mode).
func (a *App) IsAdmin() bool {
	return platform.IsAdmin()
}

// RestartAsAdmin relaunches the app elevated and quits the current instance.
func (a *App) RestartAsAdmin() error {
	if err := platform.RelaunchElevated(); err != nil {
		return err
	}
	a.QuitApp() // sets the quitting flag so OnBeforeClose actually lets us exit
	return nil
}

// ---- Settings ----

// GetAutostart reports whether the app starts on system login.
func (a *App) GetAutostart() bool {
	return platform.GetAutostart()
}

// SetAutostart enables or disables starting the app on system login.
func (a *App) SetAutostart(enabled bool) error {
	return platform.SetAutostart(enabled)
}
