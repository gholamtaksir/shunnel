// Package ping measures reachability/latency to SSH endpoints.
package ping

import (
	"context"
	"fmt"
	"io"
	"net"
	"net/http"
	"strconv"
	"time"

	"golang.org/x/crypto/ssh"

	"Shunnel/internal/model"
)

// Result is the outcome of a single latency probe.
type Result struct {
	Ms  int
	OK  bool
	Err string
}

// TCP measures the time to establish a TCP connection to host:port.
//
// Unlike ICMP echo, this needs no special privileges on Windows, and since we
// connect straight to the SSH port it is a good proxy for SSH reachability.
func TCP(host string, port int, timeout time.Duration) Result {
	start := time.Now()
	addr := net.JoinHostPort(host, strconv.Itoa(port))
	conn, err := net.DialTimeout("tcp", addr, timeout)
	if err != nil {
		return Result{OK: false, Err: err.Error()}
	}
	_ = conn.Close()
	return Result{OK: true, Ms: int(time.Since(start).Milliseconds())}
}

// RealThroughSSH measures the *real* latency to testURL through the given SSH
// server's tunnel: it opens an SSH connection, dials the test host through it
// (exactly like the proxy does), and times an HTTP request to a 204 endpoint.
//
// Unlike TCP — which only checks that the SSH port accepts a connection — this
// reflects the end-to-end latency a user actually gets when browsing via this
// server. The measured time includes the SSH handshake, so it is the full cost
// of reaching the internet through this server. srv's secret/passphrase must
// already be decrypted.
func RealThroughSSH(srv model.ServerProfile, testURL string, timeout time.Duration) Result {
	cfg, err := sshClientConfig(srv, timeout)
	if err != nil {
		return Result{Err: err.Error()}
	}

	start := time.Now()
	addr := net.JoinHostPort(srv.Host, strconv.Itoa(sshPort(srv.Port)))
	client, err := ssh.Dial("tcp", addr, cfg)
	if err != nil {
		return Result{Err: err.Error()}
	}
	defer client.Close()

	// Route the HTTP request through the SSH tunnel (the test host is resolved
	// and dialled remotely, by the server — just like real traffic).
	httpClient := &http.Client{
		Timeout: timeout,
		Transport: &http.Transport{
			DialContext: func(_ context.Context, network, address string) (net.Conn, error) {
				return client.Dial(network, address)
			},
			DisableKeepAlives: true,
		},
	}
	resp, err := httpClient.Get(testURL)
	if err != nil {
		return Result{Err: err.Error()}
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, resp.Body)

	return Result{OK: true, Ms: int(time.Since(start).Milliseconds())}
}

// sshClientConfig builds an SSH client config from a (decrypted) profile.
func sshClientConfig(srv model.ServerProfile, timeout time.Duration) (*ssh.ClientConfig, error) {
	cfg := &ssh.ClientConfig{
		User:            srv.User,
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         timeout,
	}
	if srv.AuthMethod == model.AuthKey {
		var (
			signer ssh.Signer
			err    error
		)
		if srv.Passphrase != "" {
			signer, err = ssh.ParsePrivateKeyWithPassphrase([]byte(srv.Secret), []byte(srv.Passphrase))
		} else {
			signer, err = ssh.ParsePrivateKey([]byte(srv.Secret))
		}
		if err != nil {
			return nil, fmt.Errorf("parse private key: %w", err)
		}
		cfg.Auth = []ssh.AuthMethod{ssh.PublicKeys(signer)}
	} else {
		cfg.Auth = []ssh.AuthMethod{ssh.Password(srv.Secret)}
	}
	return cfg, nil
}

func sshPort(p int) int {
	if p == 0 {
		return 22
	}
	return p
}
