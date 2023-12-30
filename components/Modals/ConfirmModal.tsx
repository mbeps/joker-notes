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

interface ConfirmModalProps {
  children: React.ReactNode;
  onConfirm: () => void;
}

/**
 * Confirm modal component to confirm an action.
 * The cancel button will close the modal.
 * The confirm button will call the onConfirm callback.
 * `children` will be rendered as the trigger, for example confirm button.
 * @param children (React.ReactNode): children to render as trigger
 * @param onConfirm (Function): callback to call when confirm button is clicked
 * @returns (React.FC<ConfirmModalProps>): confirm modal component
 */
const ConfirmModal: React.FC<ConfirmModalProps> = ({ children, onConfirm }) => {
  /**
   * Handle confirm button click.
   * @param event (React.MouseEvent<HTMLButtonElement, MouseEvent>): mouse and button event
   */
  const handleConfirm = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    event.stopPropagation(); // prevent event bubbling
    onConfirm(); // call onConfirm callback
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger onClick={(e) => e.stopPropagation()} asChild>
        {children}
      </AlertDialogTrigger>
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
