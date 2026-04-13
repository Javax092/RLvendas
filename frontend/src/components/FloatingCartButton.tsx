import { ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "../utils/currency";

export function FloatingCartButton({
  visible,
  count,
  total,
  onClick
}: {
  visible: boolean;
  count: number;
  total: number;
  onClick: () => void;
}) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          onClick={onClick}
          className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between rounded-[24px] bg-emerald-500 px-5 py-4 text-slate-950 shadow-2xl lg:hidden"
        >
          <span className="flex items-center gap-2 font-semibold">
            <ShoppingBag size={18} />
            Ver carrinho ({count})
          </span>
          <span className="text-sm font-bold">{formatCurrency(total)}</span>
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}

