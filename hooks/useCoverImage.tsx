import { create } from "zustand";

/**
 * Represents the slice of modal state required for cover image workflows.
 * Couples the current image URL with modal visibility and mutators.
 */
type CoverImageStore = {
  url?: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onReplace: (url: string) => void;
};

/**
 * Zustand store that coordinates cover image selection across components.
 * Centralizes modal visibility and the selected upload for consistent UX.
 *
 * @returns Store utilities for managing the cover image modal and current image.
 * @see https://docs.pmnd.rs/zustand/getting-started/introduction
 */
export const useCoverImage = create<CoverImageStore>((set) => ({
  url: undefined,
  isOpen: false,
  onOpen: () => set({ isOpen: true, url: undefined }),
  onClose: () => set({ isOpen: false, url: undefined }),
  onReplace: (url: string) => set({ isOpen: true, url }),
}));
