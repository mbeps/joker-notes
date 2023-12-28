import { create } from "zustand";

type SettingsStore = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

/**
 * Manages the state of the settings modal.
 * - isOpen (boolean) - whether the settings modal is open (true) or not (false).
 * - onOpen (function) - opens the settings modal.
 * - onClose (function) - closes the settings modal.
 * @returns (object) - the state of the settings modal.
 * @see https://docs.pmnd.rs/zustand/getting-started/introduction#first-create-a-store
 */
export const useSettings = create<SettingsStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));
