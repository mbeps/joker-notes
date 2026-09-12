import Image from "next/image";
import type React from "react";
import { ASSETS } from "@/config/assets";

/**
 * Presentation component that swaps marketing hero illustrations by theme and breakpoint.
 * Uses Next.js image optimization for responsive loading.
 *
 * @returns Image collage illustrating Joker Notes features.
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/images
 */
const Heroes: React.FC = () => {
  return (
    <div className="flex max-w-5xl flex-col items-center justify-center">
      <div className="flex items-center">
        <div className="relative h-[300px] w-[300px] sm:h-[350px] sm:w-[350px] md:h-[400px] md:w-[400px]">
          {/* Light Mode Theme */}
          <Image
            src={ASSETS.DOCUMENTS.LIGHT}
            fill
            className="object-contain dark:hidden"
            alt="Documents"
          />
          {/* Dark Mode Theme */}
          <Image
            src={ASSETS.DOCUMENTS.DARK}
            fill
            className="hidden object-contain dark:block"
            alt="Documents"
          />
        </div>
        <div className="relative hidden h-[400px] w-[400px] md:block">
          {/* Light Mode Theme */}
          <Image
            src={ASSETS.READING.LIGHT}
            fill
            className="object-contain dark:hidden"
            alt="Reading"
          />
          {/* Dark Mode Theme */}
          <Image
            src={ASSETS.READING.DARK}
            fill
            className="hidden object-contain dark:block"
            alt="Reading"
          />
        </div>
      </div>
    </div>
  );
};

export default Heroes;
