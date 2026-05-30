import {
  GetServers,
  AddServer,
  UpdateServer,
  DeleteServer,
  PingServer,
  PingAll,
} from '../../wailsjs/go/main/App'
import { main, model } from '../../wailsjs/go/models'

export type ServerProfile = model.ServerProfile
export type PingResult = main.PingResult
export type AuthMethod = 'password' | 'key'

/** What the add/edit form collects before sending to Go. */
export interface ServerInput {
  id?: string
  name: string
  host: string
  port: number
  user: string
  authMethod: AuthMethod
  secret?: string
  passphrase?: string
}

export const serversApi = {
  list: (): Promise<ServerProfile[]> => GetServers(),
  add: (p: ServerInput): Promise<ServerProfile> =>
    AddServer(p as unknown as model.ServerProfile),
  update: (p: ServerInput): Promise<void> =>
    UpdateServer(p as unknown as model.ServerProfile),
  remove: (id: string): Promise<void> => DeleteServer(id),
  ping: (id: string): Promise<PingResult> => PingServer(id),
  pingAll: (): Promise<void> => PingAll(),
}
