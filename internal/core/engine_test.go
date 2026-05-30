package core

import (
	"net"
	"strconv"
	"testing"
	"time"

	"Shunnel/internal/model"
)

func freePort(t *testing.T) int {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("freePort: %v", err)
	}
	defer ln.Close()
	return ln.Addr().(*net.TCPAddr).Port
}

// TestEngineStartServesProxy verifies the whole sing-box pipeline: a config is
// built, parsed, and started, and the local proxy port actually listens. The
// SSH server points at TEST-NET (192.0.2.1) and is never dialed, so no real
// network connection is required.
func TestEngineStartServesProxy(t *testing.T) {
	port := freePort(t)
	cfg := BuildProxyConfig(
		model.ProxySettings{Protocol: model.ProxyMixed, BindScope: model.BindLocal, Port: port},
		model.ServerProfile{Host: "192.0.2.1", Port: 22, User: "x", AuthMethod: model.AuthPassword, Secret: "y"},
	)

	e := New()
	if err := e.Start(cfg); err != nil {
		t.Fatalf("start: %v", err)
	}
	if !e.Running() {
		t.Fatal("expected engine to be running")
	}

	addr := net.JoinHostPort("127.0.0.1", strconv.Itoa(port))
	conn, err := net.DialTimeout("tcp", addr, 3*time.Second)
	if err != nil {
		_ = e.Stop()
		t.Fatalf("local proxy port not listening: %v", err)
	}
	_ = conn.Close()

	// Starting again while running must fail.
	if err := e.Start(cfg); err == nil {
		t.Error("expected error starting an already-running engine")
	}

	if err := e.Stop(); err != nil {
		t.Fatalf("stop: %v", err)
	}
	if e.Running() {
		t.Fatal("expected engine to be stopped")
	}
	// Stop is idempotent.
	if err := e.Stop(); err != nil {
		t.Errorf("second stop: %v", err)
	}
}
