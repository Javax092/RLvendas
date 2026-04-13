import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "./Button";
import { formatCurrency } from "../utils/currency";

export function UpsellSuggestionCard({
  suggestion,
  onAction
}: {
  suggestion: { id: string; name: string; price: number } | null;
  onAction: (productId: string) => void;
}) {
  return (
    <AnimatePresence mode="wait">
      {suggestion ? (
        <motion.div
          key={suggestion.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="rounded-[24px] border border-emerald-400/20 bg-gradient-to-r from-emerald-400/15 to-lime-300/10 p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                <Sparkles size={16} />
                IA de upsell
              </div>
              <h4 className="mt-2 text-lg font-bold text-white">{suggestion.name}</h4>
              <p className="mt-1 text-sm text-slate-300">A sugestao mais provavel para aumentar o ticket sem atrito.</p>
            </div>
            <span className="text-sm font-bold text-emerald-300">{formatCurrency(suggestion.price)}</span>
          </div>
          <Button className="mt-4 w-full bg-emerald-500 text-slate-950 shadow-none" onClick={() => onAction(suggestion.id)}>
            Adicionar com 1 clique
          </Button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

