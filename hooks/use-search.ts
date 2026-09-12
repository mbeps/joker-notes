import { create } from "zustand";

/**
 * Declares the minimal shape required for search modal consumers.
 * Keeps modal state transitions co-located with the boolean flag.
 */
type SearchStore = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  toggle: () => void;
};

/**
 * Zustand store that governs the global search palette state and toggles.
 * Ensures components can summon the palette without lifting state up manually.
 *
 * @returns The command palette store containing open state and toggle helpers.
 * @see https://docs.pmnd.rs/zustand/getting-started/introduction
 */
export const useSearch = create<SearchStore>((set, get) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  toggle: () => set({ isOpen: !get().isOpen }),
}));
