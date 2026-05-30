import { create } from 'zustand'
import { connectionApi, type ConnStatus, type ProxySettings } from '../api/connection'

const initialStatus = { state: 'disconnected', serverId: '', error: '' } as ConnStatus

interface ConnectionState {
  status: ConnStatus
  proxy: ProxySettings | null
  endpoint: string
  busy: boolean
  init: () => Promise<void>
  setStatus: (s: ConnStatus) => void
  connect: (id: string) => Promise<void>
  disconnect: () => Promise<void>
  loadProxy: () => Promise<void>
  saveProxy: (p: ProxySettings) => Promise<void>
}

export const useConnection = create<ConnectionState>((set, get) => ({
  status: initialStatus,
  proxy: null,
  endpoint: '',
  busy: false,

  init: async () => {
    const [status, proxy, endpoint] = await Promise.all([
      connectionApi.status(),
      connectionApi.getProxy(),
      connectionApi.endpoint(),
    ])
    set({ status, proxy, endpoint })
  },

  setStatus: (status) => set({ status }),

  connect: async (id) => {
    set({ busy: true })
    try {
      await connectionApi.connect(id)
      set({ endpoint: await connectionApi.endpoint() })
    } finally {
      set({ busy: false })
    }
  },

  disconnect: async () => {
    set({ busy: true })
    try {
      await connectionApi.disconnect()
    } finally {
      set({ busy: false })
    }
  },

  loadProxy: async () => {
    const [proxy, endpoint] = await Promise.all([connectionApi.getProxy(), connectionApi.endpoint()])
    set({ proxy, endpoint })
  },

  saveProxy: async (p) => {
    await connectionApi.setProxy(p)
    set({ proxy: p, endpoint: await connectionApi.endpoint() })
  },
}))
