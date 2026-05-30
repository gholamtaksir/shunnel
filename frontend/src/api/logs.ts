import { GetLogs } from '../../wailsjs/go/main/App'
import { main } from '../../wailsjs/go/models'

export type LogEntry = main.LogEntry

export const logsApi = {
  getLogs: (): Promise<LogEntry[]> => GetLogs(),
}
