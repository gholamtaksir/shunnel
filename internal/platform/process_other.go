//go:build !windows

package platform

// ListProcesses is a stub on non-Windows platforms for now.
func ListProcesses() []string { return nil }
