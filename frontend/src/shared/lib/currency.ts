export function toMoneyNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (value && typeof value === "object") {
    const maybe = value as {
      toNumber?: () => number;
      valueOf?: () => unknown;
    };

    try {
      if (typeof maybe.toNumber === "function") {
        const parsed = maybe.toNumber();
        return Number.isFinite(parsed) ? parsed : 0;
      }
    } catch {}

    try {
      if (typeof maybe.valueOf === "function") {
        const parsed = Number(maybe.valueOf());
        return Number.isFinite(parsed) ? parsed : 0;
      }
    } catch {}
  }

  return 0;
}

export function formatCurrency(value: unknown, locale = "pt-BR", currency = "BRL"): string {
  return toMoneyNumber(value).toLocaleString(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
