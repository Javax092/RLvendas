import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ok } from "../utils/api-response.js";
import { toPlainNumber } from "../utils/serializers.js";

const settingsSchema = z.object({
  restaurant: z.object({
    name: z.string().min(2).optional(),
    slug: z.string().min(2).optional(),
    phone: z.string().min(8).optional(),
    currency: z.string().min(3).optional(),
    timezone: z.string().min(3).optional(),
    deliveryFee: z.coerce.number().min(0).optional(),
    businessHours: z.string().min(3).optional()
  }),
  notifications: z.object({
    email: z.boolean().optional(),
    whatsapp: z.boolean().optional()
  }),
  preferences: z.object({
    autoAcceptOrders: z.boolean().optional(),
    showOutOfStock: z.boolean().optional()
  }),
  branding: z.object({
    primaryColor: z.string().min(4).optional(),
    secondaryColor: z.string().min(4).optional(),
    logoUrl: z.string().optional(),
    bannerUrl: z.string().optional(),
    heroTitle: z.string().optional(),
    heroSubtitle: z.string().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional()
  })
});

export async function getSettings(request: Request, response: Response) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: request.user?.restaurantId },
    include: { settings: true }
  });

  return response.json(
    ok({
      restaurant: {
        name: restaurant?.name ?? "RL Burger",
        slug: restaurant?.slug ?? "rlburger",
        phone: restaurant?.whatsappNumber ?? "5592999999999",
        currency: "BRL",
        timezone: "America/Manaus",
        deliveryFee: toPlainNumber(restaurant?.settings?.deliveryFee),
        businessHours: restaurant?.settings?.businessHours ?? "Seg-Dom 11:00 as 23:00"
      },
      notifications: {
        email: true,
        whatsapp: true
      },
      preferences: {
        autoAcceptOrders: Boolean(restaurant?.settings?.autoAcceptOrders ?? false),
        showOutOfStock: false
      },
      branding: {
        primaryColor: restaurant?.primaryColor ?? "#f97316",
        secondaryColor: restaurant?.secondaryColor ?? "#111827",
        logoUrl: restaurant?.logoUrl ?? "",
        bannerUrl: restaurant?.settings?.bannerUrl ?? "",
        heroTitle: restaurant?.settings?.heroTitle ?? "Seu restaurante no controle",
        heroSubtitle:
          restaurant?.settings?.heroSubtitle ?? "Receba pedidos direto no WhatsApp com operacao organizada.",
        seoTitle: restaurant?.settings?.seoTitle ?? "",
        seoDescription: restaurant?.settings?.seoDescription ?? ""
      }
    })
  );
}

export async function updateSettings(request: Request, response: Response) {
  const body = settingsSchema.parse(request.body);

  const restaurant = await prisma.restaurant.update({
    where: { id: request.user!.restaurantId },
    data: {
      name: body.restaurant.name,
      slug: body.restaurant.slug,
      whatsappNumber: body.restaurant.phone,
      primaryColor: body.branding.primaryColor,
      secondaryColor: body.branding.secondaryColor,
      logoUrl: body.branding.logoUrl,
      settings: {
        upsert: {
          update: {
            bannerUrl: body.branding.bannerUrl,
            heroTitle: body.branding.heroTitle,
            heroSubtitle: body.branding.heroSubtitle,
            seoTitle: body.branding.seoTitle,
            seoDescription: body.branding.seoDescription,
            autoAcceptOrders: body.preferences.autoAcceptOrders,
            businessHours: body.restaurant.businessHours,
            deliveryFee: body.restaurant.deliveryFee ?? 0
          },
          create: {
            bannerUrl: body.branding.bannerUrl,
            heroTitle: body.branding.heroTitle,
            heroSubtitle: body.branding.heroSubtitle,
            seoTitle: body.branding.seoTitle,
            seoDescription: body.branding.seoDescription,
            autoAcceptOrders: body.preferences.autoAcceptOrders,
            businessHours: body.restaurant.businessHours,
            deliveryFee: body.restaurant.deliveryFee ?? 0
          }
        }
      }
    },
    include: { settings: true }
  });

  return response.json(
    ok({
      restaurant: {
        name: restaurant.name,
        slug: restaurant.slug,
        phone: restaurant.whatsappNumber,
        currency: body.restaurant.currency ?? "BRL",
        timezone: body.restaurant.timezone ?? "America/Manaus",
        deliveryFee: toPlainNumber(restaurant.settings?.deliveryFee),
        businessHours: restaurant.settings?.businessHours ?? "Seg-Dom 11:00 as 23:00"
      },
      notifications: {
        email: body.notifications.email ?? true,
        whatsapp: body.notifications.whatsapp ?? true
      },
      preferences: {
        autoAcceptOrders: body.preferences.autoAcceptOrders ?? false,
        showOutOfStock: body.preferences.showOutOfStock ?? false
      },
      branding: {
        primaryColor: restaurant.primaryColor,
        secondaryColor: restaurant.secondaryColor,
        logoUrl: restaurant.logoUrl ?? "",
        bannerUrl: restaurant.settings?.bannerUrl ?? "",
        heroTitle: restaurant.settings?.heroTitle ?? "",
        heroSubtitle: restaurant.settings?.heroSubtitle ?? "",
        seoTitle: restaurant.settings?.seoTitle ?? "",
        seoDescription: restaurant.settings?.seoDescription ?? ""
      }
    })
  );
}
