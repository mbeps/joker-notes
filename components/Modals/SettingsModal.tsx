"use client";

import { useSettings } from "@/hooks/useSettings";
import React from "react";
import { Dialog, DialogContent, DialogHeader } from "../ui/dialog";
import { Label } from "../ui/label";
import { ThemeToggle } from "../ui/ThemeToggle";

/**
 * Settings modal component to change settings.
 * The settings modal can change:;
 * - The current theme
 * @returns (React.FC): settings modal component
 */
const SettingsModal: React.FC = () => {
  const settings = useSettings();

  return (
    <Dialog open={settings.isOpen} onOpenChange={settings.onClose}>
      <DialogContent>
        <DialogHeader className="border-b pb-3">
          <h2 className="text-lg font-medium">Settings</h2>
        </DialogHeader>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-y-1">
            <Label>Appearance</Label>
            <span className="text-[0.8rem] text-muted-foreground">
              Customize how Motion looks on your device
            </span>
          </div>
          <ThemeToggle />
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default SettingsModal;
