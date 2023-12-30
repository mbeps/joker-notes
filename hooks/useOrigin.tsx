import { useEffect, useState } from "react";

// gets the origin of the current window so the host name
/**
 * Fetches the host name of the current window.
 * This is useful when using the app in different environments.
 * @returns (string): the origin of the current window (host name)
 */
export const useOrigin = () => {
  const [mounted, setMounted] = useState(false);

  /**
   * Gets the origin of the current window.
   */
  const origin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return "";
  }

  return origin;
};
