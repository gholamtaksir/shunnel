import { create } from 'zustand'
import { tunApi, type TunSettings } from '../api/tun'

interface TunState {
  tun: TunSettings | null
  isAdmin: boolean
  load: () => Promise<void>
  save: (t: TunSettings) => Promise<void>
  restartAsAdmin: () => Promise<void>
}

export const useTun = create<TunState>((set) => ({
  tun: null,
  isAdmin: false,

  load: async () => {
    const [tun, isAdmin] = await Promise.all([tunApi.get(), tunApi.isAdmin()])
    set({ tun, isAdmin })
  },

  save: async (t) => {
    await tunApi.set(t)
    set({ tun: t })
  },

  restartAsAdmin: () => tunApi.restartAsAdmin(),
}))
