"use client";

import { useSettings } from "@/hooks/useSettings";
import React from "react";
import { Dialog, DialogContent, DialogHeader } from "../ui/dialog";
import { Label } from "../ui/label";
import { ThemeToggle } from "../ui/ThemeToggle";

/**
 * Modal surface that exposes application appearance settings like theme selection.
 * Driven by the global settings Zustand store so any component can open or close it.
 *
 * @returns Settings dialog for toggling application appearance.
 * @see https://docs.pmnd.rs/zustand/getting-started/introduction
 * @see https://ui.shadcn.com/docs/components/dialog
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
              Customize how Joker Notes looks on your device
            </span>
          </div>
          <ThemeToggle />
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default SettingsModal;
