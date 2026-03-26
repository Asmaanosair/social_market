import { create } from "zustand";
import { Platform } from "@/types/platform";
import { type MediaAsset } from "@/types/post";

interface ComposeState {
  content: string;
  selectedPlatforms: Platform[];
  media: MediaAsset[];
  scheduledAt: Date | null;
  platformOverrides: Partial<Record<Platform, { text: string }>>;
  isDirty: boolean;

  setContent: (content: string) => void;
  togglePlatform: (platform: Platform) => void;
  setSelectedPlatforms: (platforms: Platform[]) => void;
  addMedia: (asset: MediaAsset) => void;
  removeMedia: (id: string) => void;
  setScheduledAt: (date: Date | null) => void;
  setPlatformOverride: (platform: Platform, text: string) => void;
  removePlatformOverride: (platform: Platform) => void;
  reset: () => void;
}

const initialState = {
  content: "",
  selectedPlatforms: [] as Platform[],
  media: [] as MediaAsset[],
  scheduledAt: null as Date | null,
  platformOverrides: {} as Partial<Record<Platform, { text: string }>>,
  isDirty: false,
};

export const useComposeStore = create<ComposeState>((set) => ({
  ...initialState,

  setContent: (content) => set({ content, isDirty: true }),

  togglePlatform: (platform) =>
    set((state) => ({
      selectedPlatforms: state.selectedPlatforms.includes(platform)
        ? state.selectedPlatforms.filter((p) => p !== platform)
        : [...state.selectedPlatforms, platform],
      isDirty: true,
    })),

  setSelectedPlatforms: (platforms) =>
    set({ selectedPlatforms: platforms, isDirty: true }),

  addMedia: (asset) =>
    set((state) => ({ media: [...state.media, asset], isDirty: true })),

  removeMedia: (id) =>
    set((state) => ({
      media: state.media.filter((m) => m.id !== id),
      isDirty: true,
    })),

  setScheduledAt: (date) => set({ scheduledAt: date, isDirty: true }),

  setPlatformOverride: (platform, text) =>
    set((state) => ({
      platformOverrides: { ...state.platformOverrides, [platform]: { text } },
      isDirty: true,
    })),

  removePlatformOverride: (platform) =>
    set((state) => {
      const overrides = { ...state.platformOverrides };
      delete overrides[platform];
      return { platformOverrides: overrides, isDirty: true };
    }),

  reset: () => set(initialState),
}));
