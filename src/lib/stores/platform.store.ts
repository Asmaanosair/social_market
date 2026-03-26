import { create } from "zustand";
import { Platform, type PlatformStatus } from "@/types/platform";

interface ConnectedAccount {
  id: string;
  platform: Platform;
  displayName: string;
  avatarUrl?: string;
  status: PlatformStatus;
}

interface PlatformState {
  connectedAccounts: ConnectedAccount[];
  isLoading: boolean;
  error: string | null;

  setAccounts: (accounts: ConnectedAccount[]) => void;
  addAccount: (account: ConnectedAccount) => void;
  removeAccount: (id: string) => void;
  updateAccountStatus: (id: string, status: PlatformStatus) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePlatformStore = create<PlatformState>((set) => ({
  connectedAccounts: [],
  isLoading: false,
  error: null,

  setAccounts: (accounts) => set({ connectedAccounts: accounts }),
  addAccount: (account) =>
    set((state) => ({
      connectedAccounts: [...state.connectedAccounts, account],
    })),
  removeAccount: (id) =>
    set((state) => ({
      connectedAccounts: state.connectedAccounts.filter((a) => a.id !== id),
    })),
  updateAccountStatus: (id, status) =>
    set((state) => ({
      connectedAccounts: state.connectedAccounts.map((a) =>
        a.id === id ? { ...a, status } : a
      ),
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
