export function normalizeNumber(value: unknown, fallback = 0) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === "string") {
    const normalized = value.trim().replace(/\s+/g, "").replace(",", ".");

    if (!normalized) {
      return fallback;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeCurrencyValue(value: unknown, fallback = 0) {
  return normalizeNumber(value, fallback);
}

export function parseOptionalNumberInput(value: string) {
  const normalized = value.trim();
  return normalized ? normalizeNumber(normalized) : null;
}

export function formatCurrency(value: number | string | null | undefined) {
  const amount = normalizeCurrencyValue(value);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number.isFinite(amount) ? amount : 0);
}
