"use client";

import React from "react";
import { useScrollTop } from "../hooks/useScrollTop";
import { cn } from "@/lib/utils";
import Logo from "./Logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

type NavbarProps = {};

const Navbar: React.FC<NavbarProps> = () => {
  const scrolled = useScrollTop();

  return (
    <div
      className={cn(
        "z-50 bg-background dark:bg-[#1F1F1F] fixed top-0 flex items-center w-full p-6",
        scrolled && "border-b shadow-sm",
      )}
    >
      <Logo />
      <div
        className="
          md:ml-auto 
          md:justify-end justify-between 
          w-full 
          flex 
          items-center 
          gap-x-2"
      >
        <Button variant="ghost" size="sm">
          Log in
        </Button>

        <ThemeToggle />
      </div>
    </div>
  );
};
export default Navbar;
