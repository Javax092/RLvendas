import { Prisma } from "@prisma/client";

export type NumericValue = Prisma.Decimal | number | string | null | undefined;

export function toSafeNumber(value: NumericValue, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function toDecimalString(value: NumericValue, digits = 2) {
  return toSafeNumber(value).toFixed(digits);
}
