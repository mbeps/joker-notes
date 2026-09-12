"use client";

import type React from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useSettings } from "@/hooks/use-settings";

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
          <h2 className="font-medium text-lg">Settings</h2>
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
