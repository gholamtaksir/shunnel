package store

import (
	"Shunnel/internal/model"
	"Shunnel/internal/platform"
)

// Snapshot returns a UI-safe copy of the whole config (secrets stripped).
func (s *Store) Snapshot() model.AppConfig {
	s.mu.RLock()
	defer s.mu.RUnlock()
	c := s.cfg
	servers := make([]model.ServerProfile, len(s.cfg.Servers))
	for i, p := range s.cfg.Servers {
		servers[i] = stripSecret(p)
	}
	c.Servers = servers
	return c
}

// ServersWithSecrets returns every profile with secrets/passphrases decrypted.
// For internal use only (building the engine config) — never send to the UI.
func (s *Store) ServersWithSecrets() []model.ServerProfile {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]model.ServerProfile, 0, len(s.cfg.Servers))
	for _, p := range s.cfg.Servers {
		if sec, err := platform.Unprotect(p.Secret); err == nil {
			p.Secret = sec
		}
		if ph, err := platform.Unprotect(p.Passphrase); err == nil {
			p.Passphrase = ph
		}
		out = append(out, p)
	}
	return out
}

// Proxy returns the current local-proxy settings.
func (s *Store) Proxy() model.ProxySettings {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.cfg.Proxy
}

// SetProxy updates and persists the local-proxy settings.
func (s *Store) SetProxy(p model.ProxySettings) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.cfg.Proxy = p
	return s.save()
}

// Tun returns the current TUN settings.
func (s *Store) Tun() model.TunSettings {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.cfg.Tun
}

// SetTun updates and persists the TUN settings.
func (s *Store) SetTun(t model.TunSettings) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.cfg.Tun = t
	return s.save()
}

// SetActiveServer records the last-selected server id (or "auto").
func (s *Store) SetActiveServer(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.cfg.ActiveServer = id
	return s.save()
}
