"use client";

import EmojiPicker, { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

/**
 * Props for the icon picker including the change callback and trigger slot.
 */
interface IconPickerProps {
  onChange: (icon: string) => void;
  children: React.ReactNode;
  asChild?: boolean;
}

/**
 * Popover backed emoji picker that stores the chosen emoji via the `onChange` callback.
 * Syncs the emoji picker theme with the active Next Themes setting for visual consistency.
 *
 * @param children Trigger element rendered inside the popover trigger.
 * @param onChange Callback fired with the selected emoji.
 * @param asChild When true, forwards Radix trigger props to the child element.
 * @returns Popover-wrapped emoji picker aligned with the current theme.
 * @see https://emoji-picker-react.js.org
 * @see https://github.com/pacocoursey/next-themes
 */
const IconPicker: React.FC<IconPickerProps> = ({
  children,
  onChange,
  asChild,
}) => {
  const { resolvedTheme } = useTheme();
  const currentTheme = (resolvedTheme || "light") as keyof typeof themeMap;

  /**
   * Maps Next Themes keys to the emoji picker theme enum.
   */
  const themeMap = {
    dark: Theme.DARK,
    light: Theme.LIGHT,
  };

  /**
   * Selected emoji picker theme aligned with the current app theme.
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
