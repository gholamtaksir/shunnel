//go:build !windows

package platform

// GetAutostart is a stub on non-Windows platforms for now.
func GetAutostart() bool { return false }

// SetAutostart is a stub on non-Windows platforms for now.
func SetAutostart(bool) error { return nil }
