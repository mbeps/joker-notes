import { create } from "zustand";

/**
 * Shapes the Zustand slice used by the settings modal controller.
 * Keeps open state and the associated toggle handlers together.
 */
type SettingsStore = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

/**
 * Global Zustand store that exposes shared settings modal state to any component.
 * Avoids prop drilling by centralizing open and close toggles.
 *
 * @returns The reactive settings modal slice.
 * @see https://docs.pmnd.rs/zustand/getting-started/introduction
 */
export const useSettings = create<SettingsStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));
