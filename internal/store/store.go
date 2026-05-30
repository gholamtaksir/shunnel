// Package store persists and guards concurrent access to the AppConfig.
package store

import (
	"encoding/json"
	"fmt"
	"os"
	"sync"

	"github.com/google/uuid"

	"Shunnel/internal/model"
	"Shunnel/internal/platform"
)

// Store owns the on-disk configuration.
type Store struct {
	mu   sync.RWMutex
	path string
	cfg  model.AppConfig
}

// Open loads the config from path, creating it with defaults if missing.
// A corrupt file is backed up to <path>.corrupt and replaced with defaults.
func Open(path string) (*Store, error) {
	s := &Store{path: path, cfg: model.DefaultConfig()}
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return s, s.save()
		}
		return nil, err
	}
	var cfg model.AppConfig
	if err := json.Unmarshal(data, &cfg); err != nil {
		_ = os.Rename(path, path+".corrupt")
		s.cfg = model.DefaultConfig()
		return s, s.save()
	}
	s.cfg = cfg
	return s, nil
}

// save writes the config atomically. Callers must hold the write lock (or run
// before the store is shared).
func (s *Store) save() error {
	data, err := json.MarshalIndent(s.cfg, "", "  ")
	if err != nil {
		return err
	}
	tmp := s.path + ".tmp"
	if err := os.WriteFile(tmp, data, 0o600); err != nil {
		return err
	}
	return os.Rename(tmp, s.path)
}

func stripSecret(p model.ServerProfile) model.ServerProfile {
	p.Secret = ""
	p.Passphrase = ""
	return p
}

// Servers returns every profile with secrets stripped (safe for the UI).
func (s *Store) Servers() []model.ServerProfile {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]model.ServerProfile, len(s.cfg.Servers))
	for i, p := range s.cfg.Servers {
		out[i] = stripSecret(p)
	}
	return out
}

// Endpoint returns the host/port for a server id (no secret access).
func (s *Store) Endpoint(id string) (string, int, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, p := range s.cfg.Servers {
		if p.ID == id {
			return p.Host, p.Port, true
		}
	}
	return "", 0, false
}

// ServerByID returns a profile with its secret/passphrase decrypted. For
// internal use only (e.g. the tunnel engine) — never send this to the UI.
func (s *Store) ServerByID(id string) (model.ServerProfile, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	for _, p := range s.cfg.Servers {
		if p.ID == id {
			if sec, err := platform.Unprotect(p.Secret); err == nil {
				p.Secret = sec
			}
			if ph, err := platform.Unprotect(p.Passphrase); err == nil {
				p.Passphrase = ph
			}
			return p, true
		}
	}
	return model.ServerProfile{}, false
}

// AddServer assigns an id, encrypts secrets, stores and persists the profile.
// The returned profile has secrets stripped.
func (s *Store) AddServer(p model.ServerProfile) (model.ServerProfile, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	p.ID = uuid.NewString()
	if p.Port == 0 {
		p.Port = 22
	}
	enc, err := platform.Protect(p.Secret)
	if err != nil {
		return model.ServerProfile{}, err
	}
	p.Secret = enc
	ph, err := platform.Protect(p.Passphrase)
	if err != nil {
		return model.ServerProfile{}, err
	}
	p.Passphrase = ph
	s.cfg.Servers = append(s.cfg.Servers, p)
	if err := s.save(); err != nil {
		return model.ServerProfile{}, err
	}
	return stripSecret(p), nil
}

// UpdateServer updates an existing profile. Empty Secret/Passphrase fields keep
// the previously stored (encrypted) values, so the UI never has to round-trip
// the plaintext secret.
func (s *Store) UpdateServer(p model.ServerProfile) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.cfg.Servers {
		if s.cfg.Servers[i].ID != p.ID {
			continue
		}
		cur := s.cfg.Servers[i]
		cur.Name = p.Name
		cur.Host = p.Host
		cur.Port = p.Port
		if cur.Port == 0 {
			cur.Port = 22
		}
		cur.User = p.User
		cur.AuthMethod = p.AuthMethod
		if p.Secret != "" {
			enc, err := platform.Protect(p.Secret)
			if err != nil {
				return err
			}
			cur.Secret = enc
		}
		if p.Passphrase != "" {
			ph, err := platform.Protect(p.Passphrase)
			if err != nil {
				return err
			}
			cur.Passphrase = ph
		}
		s.cfg.Servers[i] = cur
		return s.save()
	}
	return fmt.Errorf("server %q not found", p.ID)
}

// DeleteServer removes a profile by id.
func (s *Store) DeleteServer(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.cfg.Servers {
		if s.cfg.Servers[i].ID == id {
			s.cfg.Servers = append(s.cfg.Servers[:i], s.cfg.Servers[i+1:]...)
			return s.save()
		}
	}
	return fmt.Errorf("server %q not found", id)
}
