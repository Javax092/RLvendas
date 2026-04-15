import test from "node:test";
import assert from "node:assert/strict";
import { toDecimalString, toSafeNumber } from "../src/utils/money.js";
import { serializeOrder, serializeProduct, serializeRestaurant } from "../src/utils/serializers.js";

test("toSafeNumber and toDecimalString normalize numeric input", () => {
  assert.equal(toSafeNumber("19.90"), 19.9);
  assert.equal(toSafeNumber(undefined), 0);
  assert.equal(toDecimalString("19.9"), "19.90");
});

test("serializeProduct converts decimal-like values into numbers", () => {
  const product = serializeProduct({
    id: "p1",
    categoryId: "c1",
    name: "Burger",
    description: "Classic",
    imageUrl: null,
    price: "25.50",
    costPrice: "10.25",
    compareAtPrice: null,
    stockQuantity: 3,
    isActive: true,
    isFeatured: false,
    productType: "SINGLE",
    tags: ["combo"],
  });

  assert.equal(product.price, 25.5);
  assert.equal(product.costPrice, 10.25);
  assert.equal(product.compareAtPrice, null);
});

test("serializeRestaurant normalizes nested menu values", () => {
  const restaurant = serializeRestaurant({
    id: "r1",
    name: "Don Burguer",
    slug: "don-burguer",
    description: null,
    logoUrl: null,
    primaryColor: "#f97316",
    secondaryColor: "#111827",
    whatsappNumber: "5592999999999",
    plan: "BASIC",
    isAiUpsellOn: true,
    settings: {
      deliveryFee: "5.00",
      minimumOrderAmount: "20.00",
      estimatedTimeMin: 20,
      estimatedTimeMax: 35,
    },
    categories: [
      {
        id: "c1",
        name: "Combos",
        slug: "combos",
        description: null,
        sortOrder: 1,
        isActive: true,
        products: [
          {
            id: "p1",
            categoryId: "c1",
            name: "Combo 1",
            description: "Burguer + fritas",
            imageUrl: null,
            price: "29.90",
            costPrice: "12.00",
            compareAtPrice: "35.00",
            stockQuantity: 5,
            isActive: true,
            isFeatured: true,
            productType: "COMBO",
            tags: [],
          },
        ],
      },
    ],
  });

  assert.equal(restaurant.settings?.deliveryFee, 5);
  assert.equal(restaurant.categories[0]?.products[0]?.price, 29.9);
});

test("serializeOrder normalizes totals and nested product values", () => {
  const order = serializeOrder({
    id: "o1",
    customerName: "Cliente",
    customerPhone: null,
    customerAddress: null,
    paymentMethod: "Pix",
    notes: null,
    subtotal: "20.00",
    deliveryFee: "5.00",
    total: "25.00",
    whatsappMessage: "msg",
    whatsappUrl: "https://wa.me/test",
    status: "PENDING",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    items: [
      {
        id: "i1",
        quantity: 1,
        unitPrice: "25.00",
        totalPrice: "25.00",
        notes: null,
        product: {
          id: "p1",
          categoryId: "c1",
          name: "Burger",
          description: "Classic",
          imageUrl: null,
          price: "25.00",
          stockQuantity: 5,
          isActive: true,
          isFeatured: false,
          productType: "SINGLE",
          tags: [],
        },
      },
    ],
  });

  assert.equal(order.total, 25);
  assert.equal(order.items[0]?.product.price, 25);
  assert.equal(order.items[0]?.totalPrice, 25);
});
