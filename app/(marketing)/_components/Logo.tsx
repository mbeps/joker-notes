import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Poppins } from "next/font/google";

const font = Poppins({
  subsets: ["latin"],
  weight: ["400", "600"],
});

/**
 * Marketing logo lockup that swaps assets based on the active theme.
 * Uses Next.js optimized `Image` and Google Fonts helpers.
 *
 * @returns Branded logo element suitable for marketing headers and footers.
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/images
 */
const Logo: React.FC = () => {
  return (
    <div className="hidden md:flex items-center gap-x-2">
      {/* Light Mode Logo */}
      <Image
        src="/logos/logo-light.svg"
        height="40"
        width="40"
        alt="Logo"
        className="dark:hidden"
      />
      {/* Dark Mode Logo */}
      <Image
        src="/logos/logo-dark.svg"
        height="40"
        width="40"
        alt="Logo"
        className="hidden dark:block"
      />
      {/* Logo Text */}
      <p className={cn("font-semibold", font.className)}>Joker Notes</p>
    </div>
  );
};
export default Logo;
