import { Button } from "@/components/ui/button";
import React from "react";
import Logo from "./Logo";

/**
 * Marketing footer that anchors the brand mark and quick policy links.
 * Mirrors the CTA styling used across marketing surfaces.
 *
 * @returns Footer region for marketing pages with policy shortcuts.
 * @see https://ui.shadcn.com/docs/components/button
 */
const Footer: React.FC = () => {
  return (
    <div className="flex items-center w-full p-6 bg-background z-50 dark:bg-[#1F1F1F]">
      <Logo />
      <div
        className="
					md:ml-auto 
					w-full 
					justify-between md:justify-end 
					flex 
					items-center 
					gap-x-2 
					text-muted-foreground"
      >
        <Button variant="ghost" size="sm">
          Privacy Policy
        </Button>
        <Button variant="ghost" size="sm">
          Terms & Conditions
        </Button>
      </div>
    </div>
  );
};
export default Footer;
