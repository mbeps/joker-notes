import { useState, useEffect } from "react";

/**
 * Checks if the user has scrolled past the threshold.
 * The threshold is the number of pixels from the top of the page.
 * @param threshold (number): the threshold to trigger the scroll top.
 * @returns (boolean): whether the user has scrolled past the threshold (true) or not (false).
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
