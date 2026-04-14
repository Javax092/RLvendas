export function formatCurrency(value: number | string | null | undefined) {
  const amount = Number(value);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number.isFinite(amount) ? amount : 0);
}
