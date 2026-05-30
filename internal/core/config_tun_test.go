package core

import (
	"testing"

	"Shunnel/internal/model"
)

func sampleServers() []model.ServerProfile {
	return []model.ServerProfile{
		{ID: "a", Host: "1.2.3.4", Port: 22, User: "root", AuthMethod: model.AuthPassword, Secret: "pw"},
		{ID: "b", Host: "5.6.7.8", Port: 2222, User: "user", AuthMethod: model.AuthKey, Secret: "KEY", Passphrase: "pp"},
	}
}

// These tests validate that the generated configs satisfy sing-box's strict
// (DisallowUnknownFields) parser — without starting an instance, so no admin
// or TUN adapter is needed.

func TestTunWhitelistConfigParses(t *testing.T) {
	cfg := BuildConfig(
		model.ProxySettings{Protocol: model.ProxyMixed, BindScope: model.BindLocal, Port: 2080},
		sampleServers(),
		"auto",
		model.TunSettings{
			Enabled: true,
			Mode:    model.TunWhitelist,
			CIDRs:   []string{"8.8.8.8/32", "10.0.0.0/8"},
			Apps:    []string{"chrome.exe", `C:\Program Files\App\app.exe`},
			Domains: []string{"github.com", ".ir"},
		},
	)
	if err := Validate(cfg); err != nil {
		t.Fatalf("whitelist TUN config invalid: %v", err)
	}
}

func TestTunBlacklistConfigParses(t *testing.T) {
	cfg := BuildConfig(
		model.ProxySettings{Protocol: model.ProxyMixed, BindScope: model.BindLocal, Port: 2080, SetSystemProxy: true},
		sampleServers(),
		"a",
		model.TunSettings{
			Enabled: true,
			Mode:    model.TunBlacklist,
			CIDRs:   []string{"192.168.0.0/16"},
			Apps:    []string{"game.exe"},
			Domains: []string{".ir", "arvancloud.ir"},
		},
	)
	if err := Validate(cfg); err != nil {
		t.Fatalf("blacklist TUN config invalid: %v", err)
	}
}

func TestProxyConfigParses(t *testing.T) {
	cfg := BuildConfig(
		model.ProxySettings{Protocol: model.ProxySocks, BindScope: model.BindAll, Port: 1080, AuthEnabled: true, Username: "u", Password: "p"},
		sampleServers(),
		"auto",
		model.TunSettings{},
	)
	if err := Validate(cfg); err != nil {
		t.Fatalf("proxy config invalid: %v", err)
	}
}
