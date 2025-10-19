import { useState, useEffect } from "react";

/**
 * Tracks whether the window scroll offset has crossed a threshold so sticky UI can react.
 * Avoids manual listener management in components consuming scroll state.
 *
 * @param threshold Pixels from the top that should trigger the scrolled state.
 * @returns True when the user has scrolled beyond the provided threshold.
 * @see https://react.dev/reference/react/useEffect
 */
export const useScrollTop = (threshold = 10) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > threshold) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return scrolled;
};
