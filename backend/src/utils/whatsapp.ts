type WhatsAppItem = {
  name: string;
  quantity: number;
  totalPrice: number;
  notes?: string | null;
};

type WhatsAppPayload = {
  restaurantName?: string | null;
  customerName: string;
  customerPhone?: string | null;
  customerAddress?: string | null;
  fulfillmentType?: string | null;
  items: WhatsAppItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  notes?: string | null;
};

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

export function buildWhatsAppMessage(payload: WhatsAppPayload) {
  const itemLines = payload.items.map((item) => {
    return `- ${item.name} x${item.quantity} - ${formatCurrency(item.totalPrice)}`;
  });

  const lines = [
    `🍔 Pedido - ${payload.restaurantName || "Don Burguer"}`,
    "",
    "Itens:",
    ...itemLines,
    "",
    `Total: ${formatCurrency(payload.total)}`,
    "",
    `Entrega: ${payload.fulfillmentType === "PICKUP" ? "Retirada no local" : "Entrega"}`,
    `Pagamento: ${payload.paymentMethod}`,
    `Endereco: ${payload.customerAddress || "Retirada no local"}`,
    "",
    `Observacoes: ${payload.notes || "Sem observacoes"}`
  ];

  return lines.join("\n");
}

export function buildWhatsAppUrl(phone: string, message: string) {
  const sanitizedPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(message)}`;
}
