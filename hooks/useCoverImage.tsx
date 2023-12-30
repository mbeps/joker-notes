import { create } from "zustand";

type CoverImageStore = {
  url?: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onReplace: (url: string) => void;
};

/**
 * Manages the state of the cover image modal.
 * - url (string): the url of the cover image.
 * - isOpen (boolean): whether the cover image modal is open (true) or not (false).
 * - onOpen (function): opens the cover image modal.
 * - onClose (function): closes the cover image modal.
 * - onReplace (function): replaces the cover image.
 * @returns (object): the state of the cover image modal.
 * @see https://docs.pmnd.rs/zustand/getting-started/introduction#first-create-a-store
 */
export const useCoverImage = create<CoverImageStore>((set) => ({
  url: undefined,
  isOpen: false,
  onOpen: () => set({ isOpen: true, url: undefined }),
  onClose: () => set({ isOpen: false, url: undefined }),
  onReplace: (url: string) => set({ isOpen: true, url }),
}));
