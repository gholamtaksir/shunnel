//go:build !windows

package platform

import "errors"

// IsAdmin is a stub on non-Windows platforms (elevation handled differently).
func IsAdmin() bool { return true }

// RelaunchElevated is not implemented on non-Windows platforms yet.
func RelaunchElevated() error {
	return errors.New("elevation is not supported on this platform")
}
