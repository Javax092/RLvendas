import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeCartItems,
  normalizeOrder,
  normalizeProduct,
  normalizePublicMenuResponse,
} from "./helpers";

test("normalizeProduct converts decimal-like strings into safe numbers", () => {
  const product = normalizeProduct({
    id: "p1",
    categoryId: "c1",
    name: "Burger",
    description: "Classic",
    price: "24.90",
    costPrice: "10.25",
    compareAtPrice: null,
    stockQuantity: "5",
    isActive: true,
    isFeatured: false,
    productType: "SINGLE",
    tags: ["featured"],
    promotionalPrice: "20.90",
    promotion: {
      id: "promo-1",
      title: "Desconto",
      type: "percentage",
      value: "10",
      active: true
    }
  });

  assert.equal(product.price, 24.9);
  assert.equal(product.costPrice, 10.25);
  assert.equal(product.stockQuantity, 5);
  assert.equal(product.promotionalPrice, 20.9);
  assert.equal(product.promotion?.title, "Desconto");
});

test("normalizePublicMenuResponse normalizes nested categories and products", () => {
  const menu = normalizePublicMenuResponse({
    id: "r1",
    name: "Don Burguer",
    slug: "don-burguer",
    whatsappNumber: "5592999999999",
    primaryColor: "#f97316",
    secondaryColor: "#111827",
    categories: [
      {
        id: "c1",
        name: "Combos",
        slug: "combos",
        sortOrder: "1",
        isActive: true,
        products: [
          {
            id: "p1",
            name: "Combo 1",
            description: "Burguer + fritas",
            price: "29.90",
            stockQuantity: "4",
            isActive: true,
            isFeatured: true,
            productType: "COMBO",
            tags: [],
          },
        ],
      },
    ],
  });

  assert.equal(menu.categories?.[0]?.products?.[0]?.price, 29.9);
  assert.equal(menu.categories?.[0]?.products?.[0]?.categoryId, "c1");
});

test("normalizeCartItems drops invalid entries and normalizes persisted prices", () => {
  const items = normalizeCartItems([
    {
      product: {
        id: "p1",
        categoryId: "c1",
        name: "Burger",
        description: "Classic",
        price: "24.90",
        isActive: true,
        isFeatured: false,
        productType: "SINGLE",
        tags: [],
      },
      quantity: "2",
    },
    {
      quantity: 1,
    },
  ]);

  assert.equal(items.length, 1);
  assert.equal(items[0]?.product.price, 24.9);
  assert.equal(items[0]?.quantity, 2);
});

test("normalizeOrder converts subtotal and item totals to numbers", () => {
  const order = normalizeOrder({
    id: "o1",
    customerName: "Cliente",
    paymentMethod: "Pix",
    subtotal: "20.00",
    deliveryFee: "5.00",
    total: "25.00",
    whatsappMessage: "msg",
    whatsappUrl: "https://wa.me/test",
    status: "PENDING",
    createdAt: "2026-01-01T00:00:00.000Z",
    items: [
      {
        id: "i1",
        quantity: 1,
        totalPrice: "25.00",
        product: {
          id: "p1",
          categoryId: "c1",
          name: "Burger",
          description: "Classic",
          price: "25.00",
          isActive: true,
          isFeatured: false,
          productType: "SINGLE",
          tags: [],
        },
      },
    ],
  });

  assert.equal(order.subtotal, 20);
  assert.equal(order.deliveryFee, 5);
  assert.equal(order.total, 25);
  assert.equal(order.items[0]?.product.price, 25);
});
