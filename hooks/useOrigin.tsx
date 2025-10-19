import { useEffect, useState } from "react";

/**
 * Returns the browser origin string once the component has hydrated to avoid SSR mismatches.
 * Enables client-side code to construct absolute URLs without guessing deployment hosts.
 *
 * @returns The window origin after hydration, or an empty string during SSR.
 * @see https://nextjs.org/docs/app/building-your-application/rendering/client-components
 */
export const useOrigin = () => {
  const [mounted, setMounted] = useState(false);

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
