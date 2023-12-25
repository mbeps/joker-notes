import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Poppins } from "next/font/google";

const font = Poppins({
  subsets: ["latin"],
  weight: ["400", "600"],
});

const Logo: React.FC = () => {
  return (
    <div className="hidden md:flex items-center gap-x-2">
      <Image
        src="/logos/logo-light.ico"
        height="40"
        width="40"
        alt="Logo"
        className="dark:hidden"
      />
      <Image
        src="/logos/logo-dark.ico"
        height="40"
        width="40"
        alt="Logo"
        className="hidden dark:block"
      />
      <p className={cn("font-semibold", font.className)}>Motion</p>
    </div>
  );
};
export default Logo;
