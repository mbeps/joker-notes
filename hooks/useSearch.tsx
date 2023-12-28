import { create } from "zustand";

type SearchStore = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  toggle: () => void;
};

/**
 * Manages the state of the search modal.
 * - isOpen (boolean) - whether the search modal is open (true) or not (false).
 * - onOpen (function) - opens the search modal.
 * - onClose (function) - closes the search modal.
 * - toggle (function) - toggles the search modal (open/close).
 * @returns (object) - the state of the search modal.
 * @see https://docs.pmnd.rs/zustand/getting-started/introduction#first-create-a-store
 */
export const useSearch = create<SearchStore>((set, get) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  toggle: () => set({ isOpen: !get().isOpen }),
}));
