import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { suggestUpsell } from "../../services/upsell.js";
import { ApiError } from "../../utils/api-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { toDecimalString, toSafeNumber } from "../../utils/money.js";
import { serializeOrder } from "../../utils/serializers.js";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "../../utils/whatsapp.js";
import {
  createOrderSchema,
  publicUpsellSchema,
  updateOrderStatusSchema,
} from "./schema.js";

function normalizeSlug(slug: string) {
  return slug.toLowerCase().replace(/burguer/g, "burger").replace(/[^a-z0-9]/g, "");
}

async function findRestaurantByPublicSlug(slug: string) {
  const exactMatch = await prisma.restaurant.findUnique({
    where: {
      slug
    }
  });

  if (exactMatch) {
    return exactMatch;
  }

  const normalizedSlug = normalizeSlug(slug);
  const restaurants = await prisma.restaurant.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      whatsappNumber: true
    }
  });

  return (
    restaurants.find((restaurant) => normalizeSlug(restaurant.slug) === normalizedSlug) ?? null
  );
}

export const createPublicOrder = asyncHandler(async (request: Request, response: Response) => {
  const body = createOrderSchema.parse(request.body);
  const slug = String(request.params.slug);

  const restaurant = await findRestaurantByPublicSlug(slug);

  if (!restaurant) {
    throw new ApiError(404, "Restaurante nao encontrado.");
  }

  const productIds = [...new Set(body.items.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      restaurantId: restaurant.id,
      isActive: true
    }
  });

  if (products.length !== productIds.length) {
    throw new ApiError(400, "Um ou mais produtos sao invalidos para este restaurante.");
  }

  const productMap = new Map(products.map((product) => [product.id, product]));
  const orderItems = body.items.map((item) => {
    const product = productMap.get(item.productId);

    if (!product) {
      throw new ApiError(400, "Produto invalido no pedido.");
    }

    const unitPrice = toSafeNumber(product.price);
    return {
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      notes: item.notes ?? null,
      unitPrice,
      totalPrice: unitPrice * item.quantity
    };
  });

  const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const settings = await prisma.restaurantSetting.findUnique({
    where: {
      restaurantId: restaurant.id
    }
  });
  const deliveryFee = toSafeNumber(settings?.deliveryFee ?? 0);
  const minimumOrderAmount = toSafeNumber(settings?.minimumOrderAmount ?? 0);

  if (subtotal < minimumOrderAmount) {
    throw new ApiError(
      400,
      `Pedido minimo nao atingido. Valor minimo: ${minimumOrderAmount.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}.`,
    );
  }

  const total = subtotal + deliveryFee;
  const whatsappMessage = buildWhatsAppMessage({
    restaurantName: restaurant.name,
    customerName: body.customerName,
    customerPhone: body.customerPhone,
    customerAddress: body.customerAddress,
    items: orderItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      totalPrice: item.totalPrice,
      notes: item.notes
    })),
    subtotal,
    deliveryFee,
    total,
    paymentMethod: body.paymentMethod,
    notes: body.notes
  });
  const whatsappUrl = buildWhatsAppUrl(restaurant.whatsappNumber, whatsappMessage);

  const customer = await prisma.customer.upsert({
    where: {
      restaurantId_phone: {
        restaurantId: restaurant.id,
        phone: body.customerPhone ?? body.customerName
      }
    },
    update: {
      name: body.customerName,
      totalOrders: {
        increment: 1
      },
      totalSpent: {
        increment: total
      },
      lastOrderDate: new Date()
    },
    create: {
      restaurantId: restaurant.id,
      name: body.customerName,
      phone: body.customerPhone ?? body.customerName,
      totalOrders: 1,
      totalSpent: toDecimalString(total),
      lastOrderDate: new Date()
    }
  });

  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        restaurantId: restaurant.id,
        customerId: customer.id,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        customerAddress: body.customerAddress,
        paymentMethod: body.paymentMethod,
        notes: body.notes,
        subtotal: toDecimalString(subtotal),
        deliveryFee: toDecimalString(deliveryFee),
        total: toDecimalString(total),
        whatsappMessage,
        whatsappUrl,
        items: {
          create: orderItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: toDecimalString(item.unitPrice),
            totalPrice: toDecimalString(item.totalPrice),
            notes: item.notes
          }))
        }
      }
    });

    for (const item of orderItems) {
      await tx.product.update({
        where: {
          id: item.productId
        },
        data: {
          stockQuantity: {
            decrement: item.quantity
          }
        }
      });
    }

    return createdOrder;
  });

  void prisma.loyalty
    .upsert({
      where: {
        customerId: customer.id
      },
      update: {
        points: {
          increment: body.items.length * 10 + Math.floor(total / 10)
        },
        rewards: {
          set: []
        }
      },
      create: {
        customerId: customer.id,
        points: body.items.length * 10 + Math.floor(total / 10),
        rewards: []
      }
    })
    .catch((error) => {
      console.error("[order:loyalty]", error);
    });

  void prisma.analyticsEvent
    .create({
      data: {
        restaurantId: restaurant.id,
        type: "order_created",
        payload: {
          orderId: order.id,
          total
        }
      }
    })
    .catch((error) => {
      console.error("[order:analytics]", error);
    });

  return response.status(201).json({
    data: {
      id: order.id,
      total,
      status: order.status,
      whatsappMessage,
      whatsappUrl
    }
  });
});

export const getPublicUpsellSuggestion = asyncHandler(async (request: Request, response: Response) => {
  const body = publicUpsellSchema.parse(request.body);
  const slug = String(request.params.slug);

  const restaurant = await findRestaurantByPublicSlug(slug);

  if (!restaurant) {
    throw new ApiError(404, "Restaurante nao encontrado.");
  }

  const products = await prisma.product.findMany({
    where: {
      restaurantId: restaurant.id,
      isActive: true
    },
    include: {
      category: true
    }
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
        price: toSafeNumber(product.price),
        quantity: item.quantity
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const suggestion = suggestUpsell(
    cartItems,
    products.map((product) => ({
      id: product.id,
      name: product.name,
      categoryName: product.category.name,
      price: toSafeNumber(product.price),
      tags: product.tags
    }))
  );

  return response.json({ suggestion });
});

export const listOrders = asyncHandler(async (request: Request, response: Response) => {
  const status = typeof request.query.status === "string" ? request.query.status : undefined;
  const allowedStatuses = new Set(["PENDING", "PREPARING", "READY", "DELIVERED", "CANCELLED"]);

  if (status && !allowedStatuses.has(status)) {
    throw new ApiError(400, "Status invalido para filtro.");
  }

  const orders = await prisma.order.findMany({
    where: {
      restaurantId: request.user!.restaurantId,
      status: status as "PENDING" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED" | undefined
    },
    include: {
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return response.json({ data: orders.map(serializeOrder) });
});

export const getOrder = asyncHandler(async (request: Request, response: Response) => {
  const orderId = String(request.params.id);
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      restaurantId: request.user!.restaurantId
    },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });

  if (!order) {
    throw new ApiError(404, "Pedido nao encontrado.");
  }

  return response.json({ data: serializeOrder(order) });
});

export const updateOrderStatus = asyncHandler(async (request: Request, response: Response) => {
  const body = updateOrderStatusSchema.parse(request.body);
  const orderId = String(request.params.id);
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      restaurantId: request.user!.restaurantId
    }
  });

  if (!order) {
    throw new ApiError(404, "Pedido nao encontrado.");
  }

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: body.status
    }
  });

  return response.json({ data: serializeOrder({ ...updatedOrder, items: [] }) });
});
