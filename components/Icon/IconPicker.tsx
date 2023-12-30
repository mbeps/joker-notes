"use client";

import EmojiPicker, { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface IconPickerProps {
  onChange: (icon: string) => void;
  children: React.ReactNode;
  asChild?: boolean;
}

const IconPicker: React.FC<IconPickerProps> = ({
  children,
  onChange,
  asChild,
}) => {
  /**
   * Hook to get the current theme from Next.js.
   * This is used to set the Emoji Picker theme.
   */
  const { resolvedTheme } = useTheme();
  /**
   * Transform the Next.js theme to Emoji Picker theme.
   * This is because the Emoji Picker has its own theme system.
   */
  const currentTheme = (resolvedTheme || "light") as keyof typeof themeMap;

  /**
   * Map the Next.js theme to Emoji Picker theme.
   */
  const themeMap = {
    dark: Theme.DARK,
    light: Theme.LIGHT,
  };

  /**
   * Get the theme from the theme map for the Emoji Picker.
   * Uses this theme to render the Emoji Picker's colour scheme.
   */
  const theme = themeMap[currentTheme];

  return (
    <Popover>
      <PopoverTrigger asChild={asChild}>{children}</PopoverTrigger>
      <PopoverContent className="p-0 w-full border-none shadow-none">
        <EmojiPicker
          height={350}
          theme={theme}
          onEmojiClick={(data) => onChange(data.emoji)}
        />
      </PopoverContent>
    </Popover>
  );
};
export default IconPicker;
