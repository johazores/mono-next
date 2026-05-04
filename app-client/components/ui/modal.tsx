"use client";

import { useCallback, useEffect } from "react";
import type { ModalProps } from "@/types";

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: ModalProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-6 bg-black/50"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] grid grid-rows-[auto_1fr_auto] overflow-hidden rounded-2xl bg-background shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <h2
              id="modal-title"
              className="text-xl font-semibold text-foreground"
            >
              {title}
            </h2>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted hover:bg-surface transition-colors"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className="min-h-0 overflow-auto px-6 py-4">{children}</div>
        <footer className="border-t border-border px-6 py-4">{footer}</footer>
      </div>
    </div>
  );
}
