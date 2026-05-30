package ping

import (
	"net"
	"strconv"
	"testing"
	"time"
)

func split(t *testing.T, addr string) (string, int) {
	t.Helper()
	host, portStr, err := net.SplitHostPort(addr)
	if err != nil {
		t.Fatalf("split %q: %v", addr, err)
	}
	port, _ := strconv.Atoi(portStr)
	return host, port
}

func TestTCPReachable(t *testing.T) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	defer ln.Close()
	go func() {
		for {
			c, err := ln.Accept()
			if err != nil {
				return
			}
			_ = c.Close()
		}
	}()

	host, port := split(t, ln.Addr().String())
	if r := TCP(host, port, 2*time.Second); !r.OK {
		t.Errorf("expected reachable, got err=%s", r.Err)
	}
}

func TestTCPUnreachable(t *testing.T) {
	// Grab a port, then close it so nothing is listening there.
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	addr := ln.Addr().String()
	_ = ln.Close()

	host, port := split(t, addr)
	if r := TCP(host, port, 1*time.Second); r.OK {
		t.Error("expected unreachable, got OK")
	}
}
