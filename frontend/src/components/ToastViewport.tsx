import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { useToast } from "../hooks/useToast";

const icons = {
  success: <CheckCircle2 size={18} />,
  error: <TriangleAlert size={18} />,
  info: <Info size={18} />
};

export function ToastViewport() {
  const { toasts } = useToast();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[80] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            className="pointer-events-auto rounded-2xl border border-white/10 bg-slate-900/95 p-4 shadow-2xl backdrop-blur"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-brand">{icons[toast.type]}</div>
              <div>
                <p className="font-semibold text-white">{toast.title}</p>
                {toast.description ? <p className="mt-1 text-sm text-slate-300">{toast.description}</p> : null}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

