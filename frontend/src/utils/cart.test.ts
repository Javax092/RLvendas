import test from "node:test";
import assert from "node:assert/strict";
import { calculateCartCount, calculateCartTotal } from "./cart";

test("calculateCartTotal handles numeric strings safely", () => {
  const total = calculateCartTotal([
    {
      product: {
        id: "p1",
        categoryId: "c1",
        name: "Burger",
        description: "Classic",
        price: "24.90" as unknown as number,
        isActive: true,
        isFeatured: false,
        productType: "SINGLE",
        tags: [],
      },
      quantity: 2,
    },
  ]);

  assert.equal(total, 49.8);
});

test("calculateCartCount sums quantities defensively", () => {
  const count = calculateCartCount([
    {
      product: {
        id: "p1",
        categoryId: "c1",
        name: "Burger",
        description: "Classic",
        price: 24.9,
        isActive: true,
        isFeatured: false,
        productType: "SINGLE",
        tags: [],
      },
      quantity: 2,
    },
    {
      product: {
        id: "p2",
        categoryId: "c1",
        name: "Batata",
        description: "Crocante",
        price: 10,
        isActive: true,
        isFeatured: false,
        productType: "ADDON",
        tags: [],
      },
      quantity: 1,
    },
  ]);

  assert.equal(count, 3);
});
