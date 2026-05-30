import { HideToTray, QuitApp } from '../../wailsjs/go/main/App'

export const windowApi = {
  hideToTray: (): Promise<void> => HideToTray(),
  quit: (): Promise<void> => QuitApp(),
}
