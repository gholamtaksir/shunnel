// Package core embeds the sing-box engine and builds its configuration from the
// app's model types.
package core

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"sync"

	box "github.com/sagernet/sing-box"
	"github.com/sagernet/sing-box/adapter"
	clashapi "github.com/sagernet/sing-box/experimental/clashapi"
	"github.com/sagernet/sing-box/include"
	sblog "github.com/sagernet/sing-box/log"
	"github.com/sagernet/sing-box/option"
	"github.com/sagernet/sing/common/observable"
	"github.com/sagernet/sing/service"
	sjson "github.com/sagernet/sing/common/json"
)

// LogCallback receives each sing-box log line (level string + message).
type LogCallback func(level, message string)

// ansiEscape matches ANSI terminal color/style escape sequences.
var ansiEscape = regexp.MustCompile(`\x1b\[[0-9;]*[a-zA-Z]`)

// Engine owns a single running sing-box instance.
type Engine struct {
	mu        sync.Mutex
	instance  *box.Box
	engineCtx context.Context

	logMu sync.RWMutex // guards onLog only
	onLog LogCallback
	logSub observable.Subscription[sblog.Entry]
}

// New returns an idle engine.
func New() *Engine { return &Engine{} }

// SetLogCallback registers fn to be called for every new INFO+ log line.
func (e *Engine) SetLogCallback(fn LogCallback) {
	e.logMu.Lock()
	e.onLog = fn
	e.logMu.Unlock()
}

// consumeLogs reads from the observable log subscription and forwards entries
// to the registered callback. Exits when the subscription channel is closed.
func (e *Engine) consumeLogs(sub observable.Subscription[sblog.Entry]) {
	for entry := range sub {
		if entry.Level > sblog.LevelInfo {
			continue
		}
		clean := strings.TrimSpace(ansiEscape.ReplaceAllString(entry.Message, ""))
		e.logMu.RLock()
		fn := e.onLog
		e.logMu.RUnlock()
		if fn != nil {
			fn(sblog.FormatLevel(entry.Level), clean)
		}
	}
}

// Start builds a sing-box instance from the given JSON-shaped config and starts it.
func (e *Engine) Start(cfg map[string]any) error {
	e.mu.Lock()
	defer e.mu.Unlock()
	if e.instance != nil {
		return errors.New("engine already running")
	}

	raw, err := json.Marshal(cfg)
	if err != nil {
		return fmt.Errorf("marshal config: %w", err)
	}

	ctx := include.Context(context.Background())
	options, err := sjson.UnmarshalExtendedContext[option.Options](ctx, raw)
	if err != nil {
		return fmt.Errorf("parse config: %w", err)
	}

	// No PlatformLogWriter — avoids needCacheFile=true side-effect.
	// Log capture uses the observable factory subscription instead.
	instance, err := box.New(box.Options{
		Context: ctx,
		Options: options,
	})
	if err != nil {
		return fmt.Errorf("create sing-box: %w", err)
	}
	if err := instance.Start(); err != nil {
		_ = instance.Close()
		return fmt.Errorf("start sing-box: %w", err)
	}
	e.instance = instance
	e.engineCtx = ctx

	// Subscribe to the observable log factory (enabled when clash_api is in config).
	if of, ok := instance.LogFactory().(sblog.ObservableFactory); ok {
		if sub, _, serr := of.Subscribe(); serr == nil {
			e.logSub = sub
			go e.consumeLogs(sub)
		}
	}
	return nil
}

// Stop closes the running instance (no-op if idle).
func (e *Engine) Stop() error {
	e.mu.Lock()
	defer e.mu.Unlock()
	if e.instance == nil {
		return nil
	}
	// Unsubscribe before Close so the log goroutine exits cleanly.
	if e.logSub != nil {
		if of, ok := e.instance.LogFactory().(sblog.ObservableFactory); ok {
			of.UnSubscribe(e.logSub)
		}
		e.logSub = nil
	}
	err := e.instance.Close()
	e.instance = nil
	e.engineCtx = nil
	return err
}

// TrafficTotal returns cumulative upload/download byte counts.
// Returns (0, 0) when not connected or traffic tracking is unavailable.
func (e *Engine) TrafficTotal() (up, down int64) {
	e.mu.Lock()
	ctx := e.engineCtx
	e.mu.Unlock()
	if ctx == nil {
		return 0, 0
	}
	cs := service.FromContext[adapter.ClashServer](ctx)
	if cs == nil {
		return 0, 0
	}
	server, ok := cs.(*clashapi.Server)
	if !ok {
		return 0, 0
	}
	return server.TrafficManager().Total()
}

// Validate parses a config through sing-box without starting it.
func Validate(cfg map[string]any) error {
	raw, err := json.Marshal(cfg)
	if err != nil {
		return err
	}
	ctx := include.Context(context.Background())
	_, err = sjson.UnmarshalExtendedContext[option.Options](ctx, raw)
	return err
}

// Running reports whether an instance is currently active.
func (e *Engine) Running() bool {
	e.mu.Lock()
	defer e.mu.Unlock()
	return e.instance != nil
}
