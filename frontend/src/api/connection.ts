import {
  Connect,
  Disconnect,
  GetStatus,
  GetProxySettings,
  SetProxySettings,
  GetProxyEndpoint,
} from '../../wailsjs/go/main/App'
import { main, model } from '../../wailsjs/go/models'

export type ConnStatus = main.ConnStatus
export type ProxySettings = model.ProxySettings
export type ConnState = 'disconnected' | 'connecting' | 'connected' | 'error'

export const connectionApi = {
  connect: (id: string): Promise<void> => Connect(id),
  disconnect: (): Promise<void> => Disconnect(),
  status: (): Promise<ConnStatus> => GetStatus(),
  getProxy: (): Promise<ProxySettings> => GetProxySettings(),
  setProxy: (p: ProxySettings): Promise<void> =>
    SetProxySettings(p as unknown as model.ProxySettings),
  endpoint: (): Promise<string> => GetProxyEndpoint(),
}
