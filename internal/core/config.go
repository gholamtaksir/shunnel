package core

import (
	"net"
	"strconv"
	"strings"

	"Shunnel/internal/model"
)

// ListenEndpoint returns the resolved "host:port" the local proxy listens on.
func ListenEndpoint(p model.ProxySettings) string {
	return net.JoinHostPort(listenAddr(p.BindScope), strconv.Itoa(orDefault(p.Port, 2080)))
}

// BuildConfig builds a sing-box config that exposes a local SOCKS/HTTP proxy,
// routes it through one of the given SSH servers, and (optionally) tunnels the
// whole system via TUN.
//
//   - selection == "auto": route via the "auto" urltest group (auto-failover).
//   - selection == <server id>: pin to that specific server.
//
// Server profiles must have their secrets already decrypted.
func BuildConfig(proxy model.ProxySettings, servers []model.ServerProfile, selection string, tun model.TunSettings) map[string]any {
	outbounds := make([]any, 0, len(servers)+3)
	nodeTags := make([]string, 0, len(servers))
	for i, srv := range servers {
		tag := nodeTag(srv, i)
		nodeTags = append(nodeTags, tag)
		outbounds = append(outbounds, sshOutbound(tag, srv))
	}
	outbounds = append(outbounds, map[string]any{
		"type":      "urltest",
		"tag":       "auto",
		"outbounds": toAny(nodeTags),
		// Same 204 endpoint as the UI's real-ping (see realPingURL); Cloudflare's
		// captive-portal URL tends to be more reachable than gstatic.
		"url":      "https://cp.cloudflare.com/generate_204",
		"interval": "3m",
	})
	def := "auto"
	if selection != "auto" && selection != "" {
		for i, srv := range servers {
			if srv.ID == selection {
				def = nodeTag(srv, i)
				break
			}
		}
	}
	outbounds = append(outbounds, map[string]any{
		"type":      "selector",
		"tag":       "proxy",
		"outbounds": toAny(append([]string{"auto"}, nodeTags...)),
		"default":   def,
	})
	outbounds = append(outbounds, map[string]any{"type": "direct", "tag": "direct"})

	inbounds := []any{proxyInbound(proxy)}
	route := map[string]any{"final": "proxy"}

	cfg := map[string]any{
		"log":       map[string]any{"level": "info", "timestamp": true},
		"outbounds": outbounds,
	}

	if tun.Enabled {
		inbounds = append(inbounds, tunInbound())
		whitelist := tun.Mode == model.TunWhitelist
		all := tun.Mode == model.TunAll

		// whitelist: listed items → proxy, everything else direct.
		// blacklist: listed items → direct, everything else tunnelled.
		// all:       everything tunnelled, lists ignored.
		target := "proxy"
		final := "direct"
		if !whitelist {
			target = "direct"
			final = "proxy"
		}

		rules := []any{
			map[string]any{"action": "sniff"},
			map[string]any{"protocol": "dns", "action": "hijack-dns"},
		}
		var dnsDomains []string
		if !all {
			if len(tun.CIDRs) > 0 {
				rules = append(rules, map[string]any{"ip_cidr": toAny(tun.CIDRs), "outbound": target})
			}
			rules = append(rules, processRules(tun.Apps, target)...)
			if len(tun.Domains) > 0 {
				rules = append(rules, map[string]any{"domain_suffix": toAny(tun.Domains), "outbound": target})
			}
			dnsDomains = tun.Domains
		}
		route = map[string]any{
			"auto_detect_interface": true,
			"rules":                 rules,
			"final":                 final,
		}
		cfg["dns"] = buildDNS(whitelist, tun.DNSProvider, tun.DNSCustom, dnsDomains)
	}

	cfg["inbounds"] = inbounds
	cfg["route"] = route
	// Enable in-process clash API for traffic tracking (no external controller).
	// cache_file is omitted — without PlatformLogWriter, needCacheFile stays
	// false and sing-box never touches the filesystem for caching.
	cfg["experimental"] = map[string]any{
		"clash_api": map[string]any{},
	}
	return cfg
}

// BuildProxyConfig is a convenience wrapper for a single pinned server, no TUN.
func BuildProxyConfig(proxy model.ProxySettings, srv model.ServerProfile) map[string]any {
	return BuildConfig(proxy, []model.ServerProfile{srv}, srv.ID, model.TunSettings{})
}

func tunInbound() map[string]any {
	return map[string]any{
		"type":           "tun",
		"tag":            "tun-in",
		"interface_name": "shunnel-tun",
		"address":        []any{"172.19.0.1/30"},
		"auto_route":     true,
		"strict_route":   true,
		"stack":          "gvisor",
	}
}

// buildDNS resolves names over the proxy (DoH) in full-tunnel mode, or locally
// in whitelist mode (so non-tunnelled apps resolve normally). DNS over the SSH
// tunnel must be TCP-based (DoH) since SSH carries no UDP.
func buildDNS(whitelist bool, provider, custom string, domains []string) map[string]any {
	server := dnsServer(provider, custom)
	proxyDNS := map[string]any{
		"type":   "https",
		"tag":    "dns-proxy",
		"server": server,
		"detour": "proxy",
	}
	// If the DoH server is a hostname (not an IP), bootstrap its name via the
	// local resolver so we can connect to it.
	if net.ParseIP(server) == nil {
		proxyDNS["domain_resolver"] = "dns-direct"
	}

	final := "dns-proxy"
	if whitelist {
		final = "dns-direct"
	}
	dns := map[string]any{
		"servers": []any{
			proxyDNS,
			map[string]any{"type": "local", "tag": "dns-direct"},
		},
		"final":    final,
		"strategy": "prefer_ipv4",
	}
	// Resolve the listed domains via the server that matches their routing:
	//   whitelist → via proxy, blacklist → locally (direct).
	if len(domains) > 0 {
		altServer := "dns-direct"
		if whitelist {
			altServer = "dns-proxy"
		}
		dns["rules"] = []any{
			map[string]any{"domain_suffix": toAny(domains), "server": altServer},
		}
	}
	return dns
}

// dnsServer maps a provider preset (or custom value) to a DoH server address.
func dnsServer(provider, custom string) string {
	switch provider {
	case "google":
		return "8.8.8.8"
	case "adguard":
		return "94.140.14.14"
	case "custom":
		if c := strings.TrimSpace(custom); c != "" {
			return c
		}
		return "1.1.1.1"
	default: // cloudflare or empty
		return "1.1.1.1"
	}
}

// processRules splits app identifiers into name-based and path-based rules.
// Entries containing a path separator are matched by full path, others by name.
func processRules(apps []string, outbound string) []any {
	var names, paths []string
	for _, a := range apps {
		if a == "" {
			continue
		}
		if strings.ContainsAny(a, `\/`) {
			paths = append(paths, a)
		} else {
			names = append(names, a)
		}
	}
	var out []any
	if len(names) > 0 {
		out = append(out, map[string]any{"process_name": toAny(names), "outbound": outbound})
	}
	if len(paths) > 0 {
		out = append(out, map[string]any{"process_path": toAny(paths), "outbound": outbound})
	}
	return out
}

func nodeTag(srv model.ServerProfile, i int) string {
	if srv.ID != "" {
		return "node-" + srv.ID
	}
	return "node-" + strconv.Itoa(i)
}

func toAny(s []string) []any {
	out := make([]any, len(s))
	for i, v := range s {
		out[i] = v
	}
	return out
}

// sshOutbound builds an "ssh" outbound from a profile whose secret/passphrase
// are already decrypted.
func sshOutbound(tag string, srv model.ServerProfile) map[string]any {
	o := map[string]any{
		"type":        "ssh",
		"tag":         tag,
		"server":      srv.Host,
		"server_port": orDefault(srv.Port, 22),
		"user":        srv.User,
	}
	if srv.AuthMethod == model.AuthKey {
		if srv.Secret != "" {
			o["private_key"] = srv.Secret
		}
		if srv.Passphrase != "" {
			o["private_key_passphrase"] = srv.Passphrase
		}
	} else if srv.Secret != "" {
		o["password"] = srv.Secret
	}
	return o
}

// proxyInbound builds the local inbound (mixed / socks / http).
func proxyInbound(p model.ProxySettings) map[string]any {
	typ := "mixed"
	switch p.Protocol {
	case model.ProxySocks:
		typ = "socks"
	case model.ProxyHTTP:
		typ = "http"
	}
	in := map[string]any{
		"type":        typ,
		"tag":         "in",
		"listen":      listenAddr(p.BindScope),
		"listen_port": orDefault(p.Port, 2080),
	}
	if p.AuthEnabled && p.Username != "" {
		in["users"] = []any{map[string]any{"username": p.Username, "password": p.Password}}
	}
	if p.SetSystemProxy && typ != "socks" {
		in["set_system_proxy"] = true
	}
	return in
}

func listenAddr(scope model.BindScope) string {
	switch scope {
	case model.BindAll:
		return "0.0.0.0"
	case model.BindLAN:
		if ip := lanIP(); ip != "" {
			return ip
		}
		return "0.0.0.0"
	default:
		return "127.0.0.1"
	}
}

// lanIP returns the primary outbound IPv4 address, or "" if undetectable.
// No packets are actually sent — this just inspects the chosen local address.
func lanIP() string {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		return ""
	}
	defer conn.Close()
	if addr, ok := conn.LocalAddr().(*net.UDPAddr); ok {
		return addr.IP.String()
	}
	return ""
}

func orDefault(v, def int) int {
	if v == 0 {
		return def
	}
	return v
}
