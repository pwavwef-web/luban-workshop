"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useUI } from "@/components/ui/UIProvider";

export function ConfirmButton({
  children,
  confirm,
  onConfirm,
  className = "btn btn-ghost",
  disabled,
  title,
  confirmLabel,
  tone = "default",
  successMessage,
}: {
  children: React.ReactNode;
  confirm: string;
  onConfirm: () => Promise<void> | void;
  className?: string;
  disabled?: boolean;
  title?: string;
  confirmLabel?: string;
  tone?: "default" | "danger";
  successMessage?: string;
}) {
  const ui = useUI();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className={className}
      disabled={disabled || busy}
      onClick={async () => {
        const ok = await ui.confirm({ message: confirm, title, confirmLabel, tone });
        if (!ok) return;
        setBusy(true);
        try {
          await onConfirm();
          if (successMessage) ui.toast.success(successMessage);
        } catch (error) {
          ui.toast.error(error instanceof Error ? error.message : "Something went wrong.");
        } finally {
          setBusy(false);
        }
      }}
      type="button"
    >
      {busy ? <Loader2 className="spin" size={16} /> : children}
    </button>
  );
}
