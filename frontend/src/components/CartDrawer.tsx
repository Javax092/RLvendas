import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { normalizeApiError } from "../api/helpers";
import { createPublicOrder, fetchPublicUpsell } from "../api/orders";
import { trackEvent } from "../api/analytics";
import { useCart } from "../hooks/useCart";
import { useToast } from "../hooks/useToast";
import { formatCurrency } from "../utils/currency";
import { Button } from "./Button";
import { Input } from "./Input";
import { UpsellSuggestionCard } from "./UpsellSuggestionCard";

type CheckoutData = {
  customerName: string;
  customerAddress: string;
  paymentMethod: string;
  notes: string;
};

const defaultCheckout = {
  customerName: "",
  customerAddress: "",
  paymentMethod: "Pix",
  notes: ""
};

export function CartDrawer({
  restaurantSlug,
  upsellEnabled,
  onAddSuggested,
  isOpen = true,
  onClose
}: {
  restaurantSlug: string;
  upsellEnabled: boolean;
  onAddSuggested: (productId: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const { items, count, total, addItem, decrementItem, removeItem, clearCart } = useCart();
  const [checkout, setCheckout] = useState<CheckoutData>(defaultCheckout);
  const [submitting, setSubmitting] = useState(false);
  const [suggestion, setSuggestion] = useState<{ id: string; name: string; price: number } | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (upsellEnabled && items.length > 0) {
      handleUpsell().catch(() => undefined);
    } else {
      setSuggestion(null);
    }
  }, [upsellEnabled, items.length]);

  async function handleUpsell() {
    if (!upsellEnabled || items.length === 0) {
      setSuggestion(null);
      return;
    }

    const response = await fetchPublicUpsell(restaurantSlug, {
      items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity }))
    });

    setSuggestion(response.suggestion);
  }

  async function handleCheckout() {
    if (!checkout.customerName || items.length === 0) {
      return;
    }

    setSubmitting(true);

    try {
      await trackEvent({
        restaurantSlug,
        type: "start_checkout",
        payload: {
          items: items.length,
          total
        }
      }).catch(() => undefined);

      const order = await createPublicOrder(restaurantSlug, {
        customerName: checkout.customerName,
        customerAddress: checkout.customerAddress,
        paymentMethod: checkout.paymentMethod,
        notes: checkout.notes,
        items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity }))
      });

      await trackEvent({
        restaurantSlug,
        type: "order_sent",
        payload: {
          total: order.total,
          items: items.length
        }
      }).catch(() => undefined);

      if (order.whatsappUrl) {
        window.open(order.whatsappUrl, "_blank", "noopener,noreferrer");
      }

      showToast({
        type: "success",
        title: "Pedido gerado",
        description: "A conversa no WhatsApp foi aberta com a mensagem formatada."
      });
      clearCart();
      setCheckout(defaultCheckout);
      setSuggestion(null);
      onClose?.();
    } catch (error) {
      const normalized = normalizeApiError(error);
      showToast({
        type: "error",
        title: "Nao foi possivel finalizar o pedido",
        description: normalized.message
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.aside
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="space-y-5 rounded-[28px] border border-white/10 bg-slate-950/95 p-5 shadow-2xl backdrop-blur"
        >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-brand">
            <ShoppingBag size={16} />
            Carrinho
          </div>
          <p className="text-sm text-slate-400">{count} itens selecionados</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-white">{formatCurrency(total)}</span>
          {onClose ? (
            <button className="rounded-full border border-white/10 p-2 text-slate-400 lg:hidden" onClick={onClose}>
              <X size={16} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
            Adicione produtos para montar seu pedido.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.product.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-medium text-white">{item.product.name}</h4>
                  <p className="text-sm text-slate-400">{formatCurrency(item.product.price)}</p>
                </div>
                <button className="text-slate-400 hover:text-red-400" onClick={() => removeItem(item.product.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  className="rounded-xl border border-white/10 p-2 text-slate-300"
                  onClick={() => decrementItem(item.product.id)}
                >
                  <Minus size={16} />
                </button>
                <span className="min-w-8 text-center text-sm text-white">{item.quantity}</span>
                <button
                  className="rounded-xl border border-white/10 p-2 text-slate-300"
                  onClick={() => addItem(item.product)}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {items.length > 0 ? (
        <div className="space-y-3 rounded-[24px] border border-brand/20 bg-brand/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-white">Upsell inteligente</h4>
              <p className="text-sm text-slate-300">Sugestoes para elevar o ticket medio.</p>
            </div>
            <Button className="px-3 py-2 text-xs" onClick={handleUpsell}>
              Analisar
            </Button>
          </div>
          {suggestion ? <UpsellSuggestionCard suggestion={suggestion} onAction={onAddSuggested} /> : <p className="text-sm text-slate-300">Analise o carrinho para sugerir o melhor complemento.</p>}
        </div>
      ) : null}

      <div className="space-y-3">
        <Input
          placeholder="Seu nome"
          value={checkout.customerName}
          onChange={(event) => setCheckout((current) => ({ ...current, customerName: event.target.value }))}
        />
        <Input
          placeholder="Endereco ou retirada"
          value={checkout.customerAddress}
          onChange={(event) => setCheckout((current) => ({ ...current, customerAddress: event.target.value }))}
        />
        <Input
          placeholder="Forma de pagamento"
          value={checkout.paymentMethod}
          onChange={(event) => setCheckout((current) => ({ ...current, paymentMethod: event.target.value }))}
        />
        <Input
          placeholder="Observacoes"
          value={checkout.notes}
          onChange={(event) => setCheckout((current) => ({ ...current, notes: event.target.value }))}
        />
        <Button className="w-full" disabled={submitting || items.length === 0} onClick={handleCheckout}>
          Finalizar pedido via WhatsApp
        </Button>
      </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
