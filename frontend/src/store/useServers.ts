import { create } from 'zustand'
import {
  serversApi,
  type ServerProfile,
  type ServerInput,
  type PingResult,
} from '../api/servers'

export interface PingState {
  ms: number
  ok: boolean
  loading: boolean
}

interface ServersState {
  servers: ServerProfile[]
  pings: Record<string, PingState>
  loading: boolean
  load: () => Promise<void>
  add: (p: ServerInput) => Promise<void>
  update: (p: ServerInput) => Promise<void>
  remove: (id: string) => Promise<void>
  pingOne: (id: string) => Promise<void>
  pingAll: () => Promise<void>
  setPing: (r: PingResult) => void
}

const markLoading = (pings: Record<string, PingState>, id: string): PingState => ({
  ms: pings[id]?.ms ?? 0,
  ok: pings[id]?.ok ?? false,
  loading: true,
})

export const useServers = create<ServersState>((set, get) => ({
  servers: [],
  pings: {},
  loading: false,

  load: async () => {
    set({ loading: true })
    try {
      set({ servers: await serversApi.list() })
    } finally {
      set({ loading: false })
    }
  },

  add: async (p) => {
    await serversApi.add(p)
    await get().load()
  },

  update: async (p) => {
    await serversApi.update(p)
    await get().load()
  },

  remove: async (id) => {
    await serversApi.remove(id)
    await get().load()
  },

  pingOne: async (id) => {
    set((s) => ({ pings: { ...s.pings, [id]: markLoading(s.pings, id) } }))
    get().setPing(await serversApi.ping(id))
  },

  pingAll: async () => {
    set((s) => {
      const pings = { ...s.pings }
      for (const srv of s.servers) pings[srv.id] = markLoading(pings, srv.id)
      return { pings }
    })
    // Results stream back via the "ping:update" event (see App.tsx).
    await serversApi.pingAll()
  },

  setPing: (r) =>
    set((s) => ({
      pings: { ...s.pings, [r.id]: { ms: r.ms, ok: r.ok, loading: false } },
    })),
}))
