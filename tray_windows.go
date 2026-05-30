//go:build windows

package main

import (
	_ "embed"

	"github.com/energye/systray"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed build/windows/icon.ico
var trayIcon []byte

// startTray initialises the system-tray icon and menu. On Windows the native
// message loop runs on its own goroutine (RunWithExternalLoop), so this returns
// quickly and won't block Wails startup.
func (a *App) startTray() {
	start, _ := systray.RunWithExternalLoop(a.onTrayReady, func() {})
	start()
}

func (a *App) onTrayReady() {
	systray.SetIcon(trayIcon)
	systray.SetTitle("Shunnel")
	systray.SetTooltip("Shunnel")
	// Left click shows the window; right click shows the menu (default).
	systray.SetOnClick(func(systray.IMenu) { a.showWindow() })

	mShow := systray.AddMenuItem("Show Shunnel", "")
	mShow.Click(a.showWindow)
	systray.AddSeparator()
	mQuit := systray.AddMenuItem("Quit", "")
	mQuit.Click(a.QuitApp)

	a.trayReady.Store(true)
}

func (a *App) showWindow() {
	if a.ctx != nil {
		runtime.WindowShow(a.ctx)
		runtime.WindowUnminimise(a.ctx)
	}
}
