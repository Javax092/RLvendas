import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { suggestUpsell } from "../services/upsell.js";
import { buildWhatsappMessage, buildWhatsappUrl } from "../services/whatsapp.js";
import { HttpError } from "../utils/http-error.js";

const createOrderSchema = z.object({
  restaurantSlug: z.string(),
  customerName: z.string().min(2),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  paymentMethod: z.string().min(2),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().cuid(),
      quantity: z.number().int().positive()
    })
  ).min(1)
});

const upsellSchema = z.object({
  restaurantSlug: z.string(),
  items: z.array(
    z.object({
      productId: z.string().cuid(),
      quantity: z.number().int().positive()
    })
  )
});

export async function createOrder(request: Request, response: Response) {
  const body = createOrderSchema.parse(request.body);

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: body.restaurantSlug },
    include: { settings: true }
  });

  if (!restaurant) {
    throw new HttpError(404, "Restaurante nao encontrado");
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: body.items.map((item) => item.productId) },
      restaurantId: restaurant.id
    }
  });

  const orderItems = body.items.map((item) => {
    const product = products.find((entry) => entry.id === item.productId);

    if (!product) {
      throw new HttpError(404, "Produto nao encontrado");
    }

    const unitPrice = Number(product.price);
    return {
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      unitPrice,
      totalPrice: unitPrice * item.quantity
    };
  });

  const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const deliveryFee = Number(restaurant.settings?.deliveryFee || 0);
  const total = subtotal + deliveryFee;
  const whatsappMessage = buildWhatsappMessage({
    items: orderItems,
    total,
    customerName: body.customerName,
    customerAddress: body.customerAddress,
    paymentMethod: body.paymentMethod,
    notes: body.notes
  });
  const whatsappUrl = buildWhatsappUrl(restaurant.whatsappNumber, whatsappMessage);

  const order = await prisma.order.create({
    data: {
      restaurantId: restaurant.id,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerAddress: body.customerAddress,
      paymentMethod: body.paymentMethod,
      notes: body.notes,
      subtotal,
      deliveryFee,
      total,
      status: "READY",
      whatsappMessage,
      whatsappUrl,
      items: {
        create: orderItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        }))
      }
    },
    include: {
      items: {
        include: { product: true }
      }
    }
  });

  return response.status(201).json(order);
}

export async function listOrders(request: Request, response: Response) {
  const orders = await prisma.order.findMany({
    where: { restaurantId: request.user?.restaurantId },
    include: {
      items: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return response.json(orders);
}

export async function getUpsellSuggestion(request: Request, response: Response) {
  const body = upsellSchema.parse(request.body);

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: body.restaurantSlug }
  });

  if (!restaurant) {
    throw new HttpError(404, "Restaurante nao encontrado");
  }

  const products = await prisma.product.findMany({
    where: { restaurantId: restaurant.id, isActive: true },
    include: { category: true }
  });

  const cartItems = body.items
    .map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      if (!product) {
        return null;
      }

      return {
        productId: product.id,
        name: product.name,
        categoryName: product.category.name,
        price: Number(product.price),
        quantity: item.quantity
      };
    })
    .filter(Boolean);

  const suggestion = suggestUpsell(
    cartItems as Array<{ productId: string; name: string; categoryName: string; price: number; quantity: number }>,
    products.map((product) => ({
      id: product.id,
      name: product.name,
      categoryName: product.category.name,
      price: Number(product.price),
      tags: product.tags
    }))
  );

  return response.json({ suggestion });
}
