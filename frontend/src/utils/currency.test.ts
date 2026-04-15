import test from "node:test";
import assert from "node:assert/strict";
import {
  formatCurrency,
  normalizeCurrencyValue,
  normalizeNumber,
  parseOptionalNumberInput,
} from "./currency";

test("normalizeNumber handles strings, commas and invalid values", () => {
  assert.equal(normalizeNumber("12.5"), 12.5);
  assert.equal(normalizeNumber("12,5"), 12.5);
  assert.equal(normalizeNumber(undefined), 0);
  assert.equal(normalizeNumber("not-a-number", 7), 7);
});

test("normalizeCurrencyValue protects against nullish values", () => {
  assert.equal(normalizeCurrencyValue(null), 0);
  assert.equal(normalizeCurrencyValue("19,90"), 19.9);
});

test("parseOptionalNumberInput returns null for empty input", () => {
  assert.equal(parseOptionalNumberInput(""), null);
  assert.equal(parseOptionalNumberInput("  "), null);
  assert.equal(parseOptionalNumberInput("42"), 42);
});

test("formatCurrency formats safely even with invalid input", () => {
  assert.equal(formatCurrency("19.9"), "R$\u00a019,90");
  assert.equal(formatCurrency(undefined), "R$\u00a00,00");
});
