import type React from "react";
import Logo from "@/app/(marketing)/_components/logo";
import { Button } from "@/components/ui/button";

/**
 * Marketing footer that anchors the brand mark and quick policy links.
 * Mirrors the CTA styling used across marketing surfaces.
 *
 * @returns Footer region for marketing pages with policy shortcuts.
 * @see https://ui.shadcn.com/docs/components/button
 */
const Footer: React.FC = () => {
  return (
    <div className="z-50 flex w-full items-center bg-background p-6 dark:bg-[#1F1F1F]">
      <Logo />
      <div className="flex w-full items-center justify-between gap-x-2 text-muted-foreground md:ml-auto md:justify-end">
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
