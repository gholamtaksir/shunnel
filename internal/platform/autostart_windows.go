//go:build windows

package platform

import (
	"os"

	"golang.org/x/sys/windows/registry"
)

const (
	autostartName = "Shunnel"
	runKeyPath    = `Software\Microsoft\Windows\CurrentVersion\Run`
)

// GetAutostart reports whether the app is registered to start on user login.
func GetAutostart() bool {
	k, err := registry.OpenKey(registry.CURRENT_USER, runKeyPath, registry.QUERY_VALUE)
	if err != nil {
		return false
	}
	defer k.Close()
	_, _, err = k.GetStringValue(autostartName)
	return err == nil
}

// SetAutostart registers or removes the login-startup entry (per-user).
func SetAutostart(enabled bool) error {
	k, err := registry.OpenKey(registry.CURRENT_USER, runKeyPath, registry.SET_VALUE)
	if err != nil {
		return err
	}
	defer k.Close()
	if !enabled {
		_ = k.DeleteValue(autostartName)
		return nil
	}
	exe, err := os.Executable()
	if err != nil {
		return err
	}
	return k.SetStringValue(autostartName, `"`+exe+`"`)
}
