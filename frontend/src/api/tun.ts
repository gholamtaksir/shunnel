import {
  GetTunSettings,
  SetTunSettings,
  IsAdmin,
  RestartAsAdmin,
  ListProcesses,
} from '../../wailsjs/go/main/App'
import { model } from '../../wailsjs/go/models'

export type TunSettings = model.TunSettings

export const tunApi = {
  get: (): Promise<TunSettings> => GetTunSettings(),
  set: (t: TunSettings): Promise<void> => SetTunSettings(t as unknown as model.TunSettings),
  isAdmin: (): Promise<boolean> => IsAdmin(),
  restartAsAdmin: (): Promise<void> => RestartAsAdmin(),
  listProcesses: (): Promise<string[]> => ListProcesses(),
}
