import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trackEvent } from "../api/analytics";
import { normalizeApiError } from "../api/helpers";
import { createPublicOrder, fetchPublicUpsell } from "../api/orders";
import { useCart } from "../hooks/useCart";
import { useToast } from "../hooks/useToast";
import { formatCurrency } from "../utils/currency";
import { Button } from "./Button";
import { Input } from "./Input";
import { UpsellSuggestionCard } from "./UpsellSuggestionCard";

type CheckoutData = {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  fulfillmentType: "DELIVERY" | "PICKUP";
  paymentMethod: string;
  notes: string;
};

const defaultCheckout: CheckoutData = {
  customerName: "",
  customerPhone: "",
  customerAddress: "",
  fulfillmentType: "DELIVERY",
  paymentMethod: "Pix",
  notes: ""
};

export function CartDrawer({
  restaurantSlug,
  upsellEnabled,
  onAddSuggested,
  isOpen = true,
  onClose,
  deliveryFee = 0,
  minimumOrderAmount = 0
}: {
  restaurantSlug: string;
  upsellEnabled: boolean;
  onAddSuggested: (productId: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  deliveryFee?: number;
  minimumOrderAmount?: number;
}) {
  const { items, count, total, addItem, decrementItem, removeItem, updateItemNotes, clearCart } = useCart();
  const [checkout, setCheckout] = useState<CheckoutData>(defaultCheckout);
  const [submitting, setSubmitting] = useState(false);
  const [suggestion, setSuggestion] = useState<{ id: string; name: string; price: number; reason?: string | null } | null>(
    null
  );
  const [upsellLoading, setUpsellLoading] = useState(false);
  const { showToast } = useToast();
  const checkoutWindowRef = useRef<Window | null>(null);
  const upsellPayload = useMemo(
    () => ({
      items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity, notes: item.notes }))
    }),
    [items]
  );
  const cartSignature = useMemo(
    () =>
      items
        .map((item) => `${item.product.id}:${item.quantity}`)
        .sort()
        .join("|"),
    [items]
  );
  const effectiveDeliveryFee = checkout.fulfillmentType === "PICKUP" ? 0 : deliveryFee;
  const subtotal = total;
  const grandTotal = subtotal + effectiveDeliveryFee;
  const minimumReached = subtotal >= minimumOrderAmount;

  useEffect(() => {
    if (!upsellEnabled || items.length === 0) {
      setSuggestion(null);
      setUpsellLoading(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      void handleUpsell();
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [cartSignature, items.length, upsellEnabled]);

  const handleUpsell = useCallback(async () => {
    if (!upsellEnabled || items.length === 0) {
      setSuggestion(null);
      return;
    }

    setUpsellLoading(true);

    try {
      const response = await fetchPublicUpsell(restaurantSlug, upsellPayload);
      setSuggestion(response.suggestion);
    } catch {
      setSuggestion(null);
    } finally {
      setUpsellLoading(false);
    }
  }, [items.length, restaurantSlug, upsellEnabled, upsellPayload]);

  async function handleCheckout() {
    if (submitting || items.length === 0) {
      return;
    }

    if (!checkout.customerName.trim()) {
      showToast({
        type: "error",
        title: "Nome obrigatorio",
        description: "Informe o nome para finalizar o pedido."
      });
      return;
    }

    if (!checkout.paymentMethod.trim()) {
      showToast({
        type: "error",
        title: "Pagamento obrigatorio",
        description: "Selecione a forma de pagamento."
      });
      return;
    }

    if (checkout.fulfillmentType === "DELIVERY" && !checkout.customerAddress.trim()) {
      showToast({
        type: "error",
        title: "Endereco obrigatorio",
        description: "Informe o endereco para pedidos de entrega."
      });
      return;
    }

    if (!minimumReached) {
      showToast({
        type: "error",
        title: "Pedido abaixo do minimo",
        description: `O valor minimo para finalizar e ${formatCurrency(minimumOrderAmount)}.`
      });
      return;
    }

    setSubmitting(true);
    checkoutWindowRef.current = window.open("", "_blank", "noopener,noreferrer");

    try {
      void trackEvent({
        restaurantSlug,
        type: "start_checkout",
        payload: {
          items: items.length,
          total: grandTotal
        }
      }).catch(() => undefined);

      const order = await createPublicOrder(restaurantSlug, {
        customerName: checkout.customerName.trim(),
        customerPhone: checkout.customerPhone.trim() || null,
        customerAddress: checkout.fulfillmentType === "PICKUP" ? null : checkout.customerAddress.trim(),
        fulfillmentType: checkout.fulfillmentType,
        paymentMethod: checkout.paymentMethod.trim(),
        notes: checkout.notes.trim() || null,
        items: upsellPayload.items
      });

      void trackEvent({
        restaurantSlug,
        type: "order_sent",
        payload: {
          total: order.total,
          items: items.length,
          fulfillmentType: checkout.fulfillmentType
        }
      }).catch(() => undefined);

      if (order.whatsappUrl) {
        if (checkoutWindowRef.current) {
          checkoutWindowRef.current.location.href = order.whatsappUrl;
        } else {
          window.open(order.whatsappUrl, "_blank", "noopener,noreferrer");
        }
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
      checkoutWindowRef.current?.close();
      const normalized = normalizeApiError(error);
      showToast({
        type: "error",
        title: "Nao foi possivel finalizar o pedido",
        description: normalized.message
      });
    } finally {
      checkoutWindowRef.current = null;
      setSubmitting(false);
    }
  }

  return isOpen ? (
    <aside className="space-y-5 rounded-[28px] border border-white/10 bg-slate-950/95 p-5 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-brand">
            <ShoppingBag size={16} />
            Carrinho
          </div>
          <p className="text-sm text-slate-400">{count} itens selecionados</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-white">{formatCurrency(grandTotal)}</span>
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
                  <p className="text-sm text-slate-400">
                    {formatCurrency(item.product.promotionalPrice ?? item.product.price)}
                  </p>
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
              <Input
                className="mt-3"
                placeholder="Observacoes do item"
                value={item.notes ?? ""}
                onChange={(event) => updateItemNotes(item.product.id, event.target.value)}
              />
            </div>
          ))
        )}
      </div>

      {items.length > 0 ? (
        <div className="space-y-3 rounded-[24px] border border-brand/20 bg-brand/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-white">Upsell inteligente</h4>
              <p className="text-sm text-slate-300">Sugestoes para elevar o ticket medio em tempo real.</p>
            </div>
            <Button className="px-3 py-2 text-xs" onClick={() => void handleUpsell()} disabled={upsellLoading}>
              {upsellLoading ? "Analisando..." : "Analisar"}
            </Button>
          </div>
          {suggestion ? (
            <UpsellSuggestionCard suggestion={suggestion} onAction={onAddSuggested} />
          ) : (
            <p className="text-sm text-slate-300">
              Analise o carrinho para sugerir fritas, sobremesas e complementos com alta conversao.
            </p>
          )}
        </div>
      ) : null}

      <div className="space-y-3">
        <Input
          placeholder="Seu nome"
          value={checkout.customerName}
          onChange={(event) => setCheckout((current) => ({ ...current, customerName: event.target.value }))}
        />
        <Input
          placeholder="Telefone para contato"
          value={checkout.customerPhone}
          onChange={(event) => setCheckout((current) => ({ ...current, customerPhone: event.target.value }))}
        />
        <select
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          value={checkout.fulfillmentType}
          onChange={(event) =>
            setCheckout((current) => ({
              ...current,
              fulfillmentType: event.target.value as "DELIVERY" | "PICKUP"
            }))
          }
        >
          <option value="DELIVERY">Entrega</option>
          <option value="PICKUP">Retirada</option>
        </select>
        <Input
          placeholder={checkout.fulfillmentType === "PICKUP" ? "Referencia opcional para retirada" : "Endereco para entrega"}
          value={checkout.customerAddress}
          onChange={(event) => setCheckout((current) => ({ ...current, customerAddress: event.target.value }))}
        />
        <select
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          value={checkout.paymentMethod}
          onChange={(event) => setCheckout((current) => ({ ...current, paymentMethod: event.target.value }))}
        >
          <option value="Pix">Pix</option>
          <option value="Dinheiro">Dinheiro</option>
          <option value="Cartao">Cartao</option>
        </select>
        <Input
          placeholder="Observacoes"
          value={checkout.notes}
          onChange={(event) => setCheckout((current) => ({ ...current, notes: event.target.value }))}
        />
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span>Taxa de entrega</span>
            <span>{checkout.fulfillmentType === "PICKUP" ? "Gratis" : formatCurrency(effectiveDeliveryFee)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between font-semibold text-white">
            <span>Total</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
          {minimumOrderAmount > 0 ? (
            <p className="mt-3 text-xs text-slate-400">Pedido minimo: {formatCurrency(minimumOrderAmount)}</p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/5 p-4 text-sm text-slate-300">
          <p className="font-semibold text-white">Automacoes WhatsApp</p>
          <p className="mt-2">Boas-vindas: confirmacao instantanea apos o pedido.</p>
          <p className="mt-1">Carrinho abandonado: lembrete para recuperar a compra.</p>
          <p className="mt-1">Upsell: oferta de adicional baseada no carrinho.</p>
        </div>
        <Button className="w-full" disabled={submitting || items.length === 0} onClick={handleCheckout}>
          {submitting ? "Enviando pedido..." : "Finalizar pedido via WhatsApp"}
        </Button>
      </div>
    </aside>
  ) : null;
}
