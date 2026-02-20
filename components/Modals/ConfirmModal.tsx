"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

/**
 * Props consumed by the confirm modal including the trigger element and confirm handler.
 */
interface ConfirmModalProps {
  children: React.ReactNode;
  onConfirm: () => void;
}

/**
 * Radix alert dialog wrapper that asks users to confirm irreversible actions.
 * Renders any trigger via `asChild` and calls `onConfirm` when the action button is pressed.
 *
 * @param children Trigger element that opens the confirmation dialog.
 * @param onConfirm Callback invoked after the confirm button is pressed.
 * @returns An alert dialog composed around the supplied trigger.
 * @see https://www.radix-ui.com/docs/primitives/components/alert-dialog
 */
const ConfirmModal: React.FC<ConfirmModalProps> = ({ children, onConfirm }) => {
  /**
   * Stops propagation so nested buttons do not trigger other handlers, then calls `onConfirm`.
   */
  const handleConfirm = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.stopPropagation(); // prevent event bubbling
    onConfirm(); // call onConfirm callback
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger 
        render={children as React.ReactElement}
        onClick={(e) => e.stopPropagation()} 
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={(event) => event.stopPropagation()}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
export default ConfirmModal;
