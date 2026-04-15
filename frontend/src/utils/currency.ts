import { formatCurrency, toMoneyNumber } from "../shared/lib/currency";

export { formatCurrency, toMoneyNumber };

export function normalizeNumber(value: unknown, fallback = 0) {
  const parsed = toMoneyNumber(value);

  if (
    parsed === 0 &&
    value !== 0 &&
    value !== "0" &&
    value !== "0.0" &&
    value !== "0,0" &&
    value !== null &&
    value !== undefined
  ) {
    return fallback;
  }

  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeCurrencyValue(value: unknown, fallback = 0) {
  return normalizeNumber(value, fallback);
}

export function parseOptionalNumberInput(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  const parsed = toMoneyNumber(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
