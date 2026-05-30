//go:build !windows

package main

// startTray is a no-op on non-Windows platforms for now.
func (a *App) startTray() {}

// showWindow is a no-op on non-Windows platforms for now.
func (a *App) showWindow() {}
