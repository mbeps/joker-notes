import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Poppins } from "next/font/google";

const font = Poppins({
  subsets: ["latin"],
  weight: ["400", "600"],
});

/**
 * Logo component for the marketing page.
 * Different logos are used depending on the theme.
 * The logo is also hidden on mobile devices.
 * @returns (React.FC): Logo component
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
