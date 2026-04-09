"use client";

import { borderRadius, zIndex } from "@/lib/colors";
import { buttonSizes, buttonStyles } from "@/lib/theme";

interface ConfirmDialogProps {
  readonly isOpen: boolean;
  readonly title: string;
  readonly description?: string;
  readonly confirmText: string;
  readonly cancelText?: string;
  readonly isConfirming?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText,
  cancelText = "Отказ",
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 ${zIndex.modalBackdrop}`}
        onClick={onCancel}
        aria-hidden="true"
      />

      <dialog
        open
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className={`fixed inset-0 ${zIndex.modalContent} m-0 w-full h-full max-w-none max-h-none p-0 border-0 bg-transparent overflow-visible pointer-events-none`}
        onCancel={(event) => {
          event.preventDefault();
          onCancel();
        }}
      >
        <div className="w-full h-full p-3 sm:p-4 flex items-start sm:items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 flex flex-col gap-4 pointer-events-auto">
            <h2
              id="confirm-dialog-title"
              className="text-base font-semibold text-neutral-dark"
            >
              {title}
            </h2>

            {description ? (
              <p className="text-sm text-neutral-dark">{description}</p>
            ) : null}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onCancel}
                disabled={isConfirming}
                className={`${buttonSizes.md} ${buttonStyles.secondary} ${borderRadius.sm}`}
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isConfirming}
                className={`${buttonSizes.md} ${buttonStyles.destructive} ${borderRadius.sm}`}
              >
                {isConfirming ? "Изпращане..." : confirmText}
              </button>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
