import type { ReactNode } from "react";
import { createContext, useMemo, useRef, useState } from "react";

type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
};

type ToastContextValue = {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, "id">) => void;
};

export const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  showToast: () => undefined
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const currentId = useRef(1);

  function showToast(toast: Omit<ToastItem, "id">) {
    const id = currentId.current++;
    setToasts((current) => [...current, { ...toast, id }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3200);
  }

  const value = useMemo(
    () => ({
      toasts,
      showToast
    }),
    [toasts]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
