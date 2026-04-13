type OrderItemInput = {
  name: string;
  quantity: number;
  totalPrice: number;
};

type BuildMessageInput = {
  items: OrderItemInput[];
  total: number;
  customerName: string;
  customerAddress?: string;
  paymentMethod: string;
  notes?: string;
};

export function buildWhatsappMessage(input: BuildMessageInput) {
  const header = "Ola, quero fazer um pedido:";
  const items = input.items
    .map((item) => `- ${item.name} (${item.quantity}x) - ${formatCurrency(item.totalPrice)}`)
    .join("\n");

  const details = [
    "",
    `Total: ${formatCurrency(input.total)}`,
    "",
    `Nome: ${input.customerName}`,
    `Endereco: ${input.customerAddress || "Retirada no local"}`,
    `Forma de pagamento: ${input.paymentMethod}`
  ];

  if (input.notes) {
    details.push(`Observacoes: ${input.notes}`);
  }

  return [header, "", items, ...details].join("\n");
}

export function buildWhatsappUrl(phone: string, message: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

