"use client";

import CoverImageModal from "@/components/Modals/CoverImageModal";
import SettingsModal from "@/components/Modals/SettingsModal";
import { useEffect, useState } from "react";

/**
 * Global Modal Provider to be used in the global Layout component.
 * This allows modals defined in the components/Modals folder to be rendered on the client side only throughout the entire app.
 * The modal cannot the rendered on the server side because it requires the window object which will cause hydration errors.
 * Only the client side will have access to the window object.
 * @returns (JSX.Element | null) - Modal Provider
 */
export const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false);

  // sets isMounted to true when the component is mounted (client side only).
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // if the component is not mounted (server side) do not render the modal.
  if (!isMounted) {
    return null;
  }

  return (
    <>
      <SettingsModal />
      <CoverImageModal />
    </>
  );
};
