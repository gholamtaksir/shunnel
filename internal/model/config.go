// Package model holds the plain data types that are shared between the Go
// backend, the persisted config file, and the Wails frontend bindings.
package model

// AuthMethod is how we authenticate to an SSH server.
type AuthMethod string

const (
	AuthPassword AuthMethod = "password"
	AuthKey      AuthMethod = "key"
)

// ServerProfile is a single SSH endpoint the user can tunnel through.
type ServerProfile struct {
	ID         string     `json:"id"`
	Name       string     `json:"name"`
	Host       string     `json:"host"`
	Port       int        `json:"port"`
	User       string     `json:"user"`
	AuthMethod AuthMethod `json:"authMethod"`
	// Secret holds the password or the private key (PEM), depending on
	// AuthMethod. It is stored encrypted at rest (DPAPI on Windows).
	Secret string `json:"secret,omitempty"`
	// Passphrase decrypts an encrypted private key (AuthKey only).
	Passphrase string `json:"passphrase,omitempty"`
}

// ProxyProtocol selects which local proxy protocol(s) to expose.
type ProxyProtocol string

const (
	ProxyMixed ProxyProtocol = "mixed" // SOCKS5 + HTTP on one port
	ProxySocks ProxyProtocol = "socks"
	ProxyHTTP  ProxyProtocol = "http"
)

// BindScope is a friendly preset for the listen address.
type BindScope string

const (
	BindLocal BindScope = "local" // 127.0.0.1
	BindLAN   BindScope = "lan"   // detected LAN IP
	BindAll   BindScope = "all"   // 0.0.0.0
)

// ProxySettings configures the local inbound proxy.
type ProxySettings struct {
	Protocol       ProxyProtocol `json:"protocol"`
	BindScope      BindScope     `json:"bindScope"`
	Port           int           `json:"port"`
	AuthEnabled    bool          `json:"authEnabled"`
	Username       string        `json:"username"`
	Password       string        `json:"password"`
	SetSystemProxy bool          `json:"setSystemProxy"`
}

// TunMode selects whitelist vs route-all behaviour.
type TunMode string

const (
	TunWhitelist TunMode = "whitelist" // only listed items go through the tunnel
	TunBlacklist TunMode = "blacklist" // everything is tunnelled except listed items
	TunAll       TunMode = "all"       // deprecated: treated as blacklist with no list
)

// TunSettings configures system-wide TUN tunnelling.
type TunSettings struct {
	Enabled     bool     `json:"enabled"`
	Mode        TunMode  `json:"mode"`
	CIDRs       []string `json:"cidrs"`       // e.g. ["10.0.0.0/8","8.8.8.8/32"]
	Apps        []string `json:"apps"`        // process names or full paths, e.g. ["chrome.exe"]
	Domains     []string `json:"domains"`     // domain suffixes, e.g. [".ir","github.com"]
	DNSProvider string   `json:"dnsProvider"` // cloudflare | google | adguard | custom
	DNSCustom   string   `json:"dnsCustom"`   // DoH server address when provider == custom
}

// AppConfig is the full persisted configuration.
type AppConfig struct {
	Servers      []ServerProfile `json:"servers"`
	ActiveServer string          `json:"activeServer"` // server ID, or "auto"
	AutoFailover bool            `json:"autoFailover"`
	Proxy        ProxySettings   `json:"proxy"`
	Tun          TunSettings     `json:"tun"`
	Language     string          `json:"language"` // "en" or "fa"
	Theme        string          `json:"theme"`    // "dark" or "light"
}

// DefaultConfig returns sane defaults for a fresh install.
func DefaultConfig() AppConfig {
	return AppConfig{
		Servers:      []ServerProfile{},
		ActiveServer: "auto",
		AutoFailover: true,
		Proxy: ProxySettings{
			Protocol:  ProxyMixed,
			BindScope: BindLocal,
			Port:      2080,
		},
		Tun: TunSettings{
			Enabled:     false,
			Mode:        TunWhitelist,
			CIDRs:       []string{},
			Apps:        []string{},
			Domains:     []string{},
			DNSProvider: "cloudflare",
		},
		Language: "en",
		Theme:    "dark",
	}
}
