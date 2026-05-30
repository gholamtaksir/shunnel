import { GetAutostart, SetAutostart, GetAppInfo } from '../../wailsjs/go/main/App'
import { main } from '../../wailsjs/go/models'

export type AppInfo = main.AppInfo

export const settingsApi = {
  getAutostart: (): Promise<boolean> => GetAutostart(),
  setAutostart: (v: boolean): Promise<void> => SetAutostart(v),
  appInfo: (): Promise<AppInfo> => GetAppInfo(),
}
