type WhatsAppItem = {
  name: string;
  quantity: number;
  totalPrice: number;
  notes?: string | null;
};

type WhatsAppPayload = {
  customerName: string;
  customerPhone?: string | null;
  customerAddress?: string | null;
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
    const noteSuffix = item.notes ? ` (${item.notes})` : "";
    return `- ${item.quantity}x ${item.name} — ${formatCurrency(item.totalPrice)}${noteSuffix}`;
  });

  const lines = [
    "Ola! Quero fazer um pedido:",
    "",
    `Cliente: ${payload.customerName}`,
    `Telefone: ${payload.customerPhone ?? "-"}`,
    `Endereco: ${payload.customerAddress ?? "-"}`,
    "",
    "Itens:",
    ...itemLines,
    "",
    `Subtotal: ${formatCurrency(payload.subtotal)}`,
    `Entrega: ${formatCurrency(payload.deliveryFee)}`,
    `Total: ${formatCurrency(payload.total)}`,
    "",
    `Pagamento: ${payload.paymentMethod}`,
    `Observacoes: ${payload.notes ?? "-"}`
  ];

  return lines.join("\n");
}

export function buildWhatsAppUrl(phone: string, message: string) {
  const sanitizedPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(message)}`;
}
