"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
}

interface PromptOptions {
  title?: string;
  message?: string;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  multiline?: boolean;
  inputType?: string;
  required?: boolean;
}

type DialogState =
  | { id: number; kind: "confirm"; options: ConfirmOptions; resolve: (value: boolean) => void }
  | { id: number; kind: "prompt"; options: PromptOptions; resolve: (value: string | null) => void };

interface UIContextValue {
  confirm(options: ConfirmOptions | string): Promise<boolean>;
  prompt(options: PromptOptions | string): Promise<string | null>;
  toast: {
    success(message: string): void;
    error(message: string): void;
    info(message: string): void;
  };
}

const UIContext = createContext<UIContextValue | null>(null);

let toastSeq = 0;
let dialogSeq = 0;

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => setMounted(true), []);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback(
    (tone: ToastTone, message: string) => {
      const id = ++toastSeq;
      setToasts((current) => [...current, { id, tone, message }]);
      window.setTimeout(() => dismissToast(id), 4600);
    },
    [dismissToast],
  );

  const finish = useCallback((result: boolean | string | null) => {
    setDialog((current) => {
      if (!current) return null;
      if (current.kind === "confirm") current.resolve(typeof result === "boolean" ? result : Boolean(result));
      else current.resolve(typeof result === "string" ? result : null);
      return null;
    });
  }, []);

  const value = useMemo<UIContextValue>(
    () => ({
      confirm(options) {
        const normalized = typeof options === "string" ? { message: options } : options;
        return new Promise<boolean>((resolve) => {
          setDialog({ id: ++dialogSeq, kind: "confirm", options: normalized, resolve });
        });
      },
      prompt(options) {
        const normalized = typeof options === "string" ? { message: options } : options;
        return new Promise<string | null>((resolve) => {
          setDialog({ id: ++dialogSeq, kind: "prompt", options: normalized, resolve });
        });
      },
      toast: {
        success: (message) => pushToast("success", message),
        error: (message) => pushToast("error", message),
        info: (message) => pushToast("info", message),
      },
    }),
    [pushToast],
  );

  return (
    <UIContext.Provider value={value}>
      {children}
      {mounted
        ? createPortal(
            <>
              {dialog ? <DialogHost key={dialog.id} dialog={dialog} onFinish={finish} /> : null}
              <ToastStack toasts={toasts} onDismiss={dismissToast} />
            </>,
            document.body,
          )
        : null}
    </UIContext.Provider>
  );
}

function DialogHost({
  dialog,
  onFinish,
}: {
  dialog: DialogState;
  onFinish: (result: boolean | string | null) => void;
}) {
  const isPrompt = dialog.kind === "prompt";
  const promptOptions = isPrompt ? (dialog.options as PromptOptions) : null;
  const confirmOptions = !isPrompt ? (dialog.options as ConfirmOptions) : null;
  const cancelValue = isPrompt ? null : false;
  const [value, setValue] = useState(promptOptions?.defaultValue ?? "");
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => fieldRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onFinish(cancelValue);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancelValue, onFinish]);

  const danger = confirmOptions?.tone === "danger";
  const title = dialog.options.title ?? (isPrompt ? "Enter a value" : "Please confirm");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (isPrompt) {
      if (promptOptions?.required && !value.trim()) {
        fieldRef.current?.focus();
        return;
      }
      onFinish(value);
    } else {
      onFinish(true);
    }
  }

  return (
    <div
      className="modal-scrim"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onFinish(cancelValue);
      }}
    >
      <form className="modal-card" role="dialog" aria-modal="true" aria-label={title} onSubmit={submit}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-button" type="button" aria-label="Close" onClick={() => onFinish(cancelValue)}>
            <X size={16} />
          </button>
        </div>
        {dialog.options.message ? <p className="modal-message">{dialog.options.message}</p> : null}
        {isPrompt ? (
          <label className="modal-field">
            {promptOptions?.label ? <span>{promptOptions.label}</span> : null}
            {promptOptions?.multiline ? (
              <textarea
                ref={(el) => {
                  fieldRef.current = el;
                }}
                value={value}
                placeholder={promptOptions?.placeholder}
                onChange={(event) => setValue(event.target.value)}
              />
            ) : (
              <input
                ref={(el) => {
                  fieldRef.current = el;
                }}
                value={value}
                type={promptOptions?.inputType ?? "text"}
                placeholder={promptOptions?.placeholder}
                onChange={(event) => setValue(event.target.value)}
              />
            )}
          </label>
        ) : null}
        <div className="modal-actions">
          <button className="btn btn-ghost" type="button" onClick={() => onFinish(cancelValue)}>
            {dialog.options.cancelLabel ?? "Cancel"}
          </button>
          <button className={danger ? "btn btn-danger-solid" : "btn btn-primary"} type="submit">
            {dialog.options.confirmLabel ?? (isPrompt ? "Save" : "Confirm")}
          </button>
        </div>
      </form>
    </div>
  );
}

function ToastStack({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((item) => {
        const Icon = item.tone === "success" ? CheckCircle2 : item.tone === "error" ? XCircle : Info;
        return (
          <div className={`toast toast-${item.tone}`} key={item.id} role="status">
            <Icon size={18} />
            <span>{item.message}</span>
            <button className="toast-close" type="button" aria-label="Dismiss" onClick={() => onDismiss(item.id)}>
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) throw new Error("useUI must be used within UIProvider.");
  return context;
}
