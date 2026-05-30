package store

import (
	"path/filepath"
	"testing"

	"Shunnel/internal/model"
)

func TestServerCRUD(t *testing.T) {
	path := filepath.Join(t.TempDir(), "config.json")
	s, err := Open(path)
	if err != nil {
		t.Fatalf("open: %v", err)
	}

	added, err := s.AddServer(model.ServerProfile{
		Name: "test", Host: "1.2.3.4", Port: 0, User: "root",
		AuthMethod: model.AuthPassword, Secret: "hunter2",
	})
	if err != nil {
		t.Fatalf("add: %v", err)
	}
	if added.ID == "" {
		t.Fatal("expected id to be assigned")
	}
	if added.Port != 22 {
		t.Errorf("expected default port 22, got %d", added.Port)
	}
	if added.Secret != "" {
		t.Error("returned profile must not include the secret")
	}

	// Servers() strips secrets.
	if list := s.Servers(); len(list) != 1 || list[0].Secret != "" {
		t.Errorf("Servers() leaked a secret or wrong count: %+v", list)
	}

	// ServerByID decrypts the secret (DPAPI round-trip on Windows).
	full, ok := s.ServerByID(added.ID)
	if !ok {
		t.Fatal("ServerByID not found")
	}
	if full.Secret != "hunter2" {
		t.Errorf("decrypted secret = %q, want hunter2", full.Secret)
	}

	// Update with an empty secret keeps the previously stored one.
	if err := s.UpdateServer(model.ServerProfile{
		ID: added.ID, Name: "renamed", Host: "1.2.3.4", Port: 2222,
		User: "root", AuthMethod: model.AuthPassword, Secret: "",
	}); err != nil {
		t.Fatalf("update: %v", err)
	}
	full, _ = s.ServerByID(added.ID)
	if full.Name != "renamed" || full.Port != 2222 {
		t.Errorf("update not applied: %+v", full)
	}
	if full.Secret != "hunter2" {
		t.Errorf("secret should persist on empty update, got %q", full.Secret)
	}

	// Persistence: reopen from disk and verify the secret still decrypts.
	s2, err := Open(path)
	if err != nil {
		t.Fatalf("reopen: %v", err)
	}
	if len(s2.Servers()) != 1 {
		t.Fatal("server was not persisted")
	}
	if full2, _ := s2.ServerByID(added.ID); full2.Secret != "hunter2" {
		t.Errorf("secret not persisted/decrypted after reopen: %q", full2.Secret)
	}

	// Delete.
	if err := s.DeleteServer(added.ID); err != nil {
		t.Fatalf("delete: %v", err)
	}
	if len(s.Servers()) != 0 {
		t.Error("server was not deleted")
	}
}
