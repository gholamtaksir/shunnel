import { create } from 'zustand'

export type Page = 'connection' | 'servers' | 'proxy' | 'tun' | 'logs' | 'settings'

interface AppState {
  page: Page
  setPage: (p: Page) => void
}

export const useAppStore = create<AppState>((set) => ({
  page: 'connection',
  setPage: (page) => set({ page }),
}))
