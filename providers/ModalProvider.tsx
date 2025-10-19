"use client";

import CoverImageModal from "@/components/Modals/CoverImageModal";
import SettingsModal from "@/components/Modals/SettingsModal";
import { useEffect, useState } from "react";

/**
 * Mounts application wide modals only on the client to avoid hydration mismatches with window APIs.
 * Gives layouts a single place to register modal components that render via Zustand state.
 *
 * @returns Wrapper that renders shared modals once the component hydrates.
 * @see https://nextjs.org/docs/app/building-your-application/rendering/client-components
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
