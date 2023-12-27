"use client";

import SettingsModal from "@/components/Modals/SettingsModal";
import { useEffect, useState } from "react";

// prevents any modals from rendering on the server
export const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <SettingsModal />
    </>
  );
};
