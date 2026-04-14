import { AxiosError } from "axios";
import type {
  BillingPlan,
  BillingSnapshot,
  Category,
  CartItem,
  Customer,
  DashboardInsights,
  FinanceSummary,
  LoyaltySummary,
  OnboardingStatus,
  Order,
  Product,
  Promotion,
  PublicMenuResponse,
  Restaurant,
  RestaurantSettings,
  RestaurantAdminSettings
} from "../types";

type Envelope<T> = {
  success?: boolean;
  data?: T;
};

export type ApiClientError = Error & {
  status?: number;
  details?: unknown;
};

export function unwrapData<T>(payload: T | Envelope<T>): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as Envelope<T>).data as T;
  }

  return payload as T;
}

export function normalizeApiError(error: unknown): ApiClientError {
  if (error instanceof AxiosError) {
    if (!error.response) {
      const normalized = new Error("Nao foi possivel conectar ao servidor.") as ApiClientError;
      normalized.details = error.toJSON();
      return normalized;
    }

    const responseData = error.response.data as
      | {
          message?: string;
          error?: { message?: string } | string;
        }
      | string
      | undefined;

    let message = error.message;

    if (typeof responseData === "string" && responseData.trim()) {
      message = responseData;
    } else if (responseData && typeof responseData === "object") {
      if (typeof responseData.message === "string" && responseData.message.trim()) {
        message = responseData.message;
      } else if (typeof responseData.error === "string" && responseData.error.trim()) {
        message = responseData.error;
      } else if (
        responseData.error &&
        typeof responseData.error === "object" &&
        typeof responseData.error.message === "string" &&
        responseData.error.message.trim()
      ) {
        message = responseData.error.message;
      }
    }

    if (error.response.status === 401 && message === error.message) {
      message = "Autenticacao necessaria. Faça login novamente.";
    }

    if (error.response.status === 403 && message === error.message) {
      message = "Voce nao tem permissao para acessar este recurso.";
    }

    const normalized = new Error(message) as ApiClientError;
    normalized.status = error.response?.status;
    normalized.details = error.response?.data;
    return normalized;
  }

  if (error instanceof Error) {
    return error as ApiClientError;
  }

  return new Error("Erro inesperado na requisicao.") as ApiClientError;
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toStringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function normalizeCategory(raw: any): Category {
  return {
    id: toStringValue(raw?.id),
    name: toStringValue(raw?.name, "Sem categoria"),
    slug: toStringValue(raw?.slug),
    description: raw?.description ?? null,
    sortOrder: toNumber(raw?.sortOrder),
    isActive: Boolean(raw?.isActive ?? true)
  };
}

export function normalizeProduct(raw: any): Product {
  return {
    id: toStringValue(raw?.id),
    categoryId: toStringValue(raw?.categoryId),
    name: toStringValue(raw?.name, "Produto sem nome"),
    description: toStringValue(raw?.description, "Sem descricao cadastrada."),
    imageUrl: raw?.imageUrl ?? null,
    price: toNumber(raw?.price),
    costPrice: raw?.costPrice == null ? null : toNumber(raw?.costPrice),
    compareAtPrice: raw?.compareAtPrice == null ? null : toNumber(raw?.compareAtPrice),
    stockQuantity: toNumber(raw?.stockQuantity, 0),
    isActive: Boolean(raw?.isActive ?? true),
    isFeatured: Boolean(raw?.isFeatured ?? false),
    productType: raw?.productType ?? "SINGLE",
    tags: Array.isArray(raw?.tags) ? raw.tags.map((tag: unknown) => String(tag)) : [],
    category: raw?.category ? normalizeCategory(raw.category) : undefined
  };
}

export function normalizeRestaurantSettings(raw: any): RestaurantSettings {
  return {
    heroTitle: toStringValue(raw?.heroTitle, "Seu burger favorito sem taxa de marketplace"),
    heroSubtitle: toStringValue(
      raw?.heroSubtitle,
      "Monte seu pedido, receba sugestoes inteligentes e finalize pelo WhatsApp.",
    ),
    seoTitle: raw?.seoTitle ?? null,
    seoDescription: raw?.seoDescription ?? null,
    deliveryFee: toNumber(raw?.deliveryFee),
    minimumOrderAmount: toNumber(raw?.minimumOrderAmount),
    estimatedTimeMin: toNumber(raw?.estimatedTimeMin, 30),
    estimatedTimeMax: toNumber(raw?.estimatedTimeMax, 45),
    bannerUrl: raw?.bannerUrl ?? null
  };
}

export function normalizePublicMenuResponse(raw: any): PublicMenuResponse {
  const categories = Array.isArray(raw?.categories) ? raw.categories : [];

  return {
    id: toStringValue(raw?.id),
    name: toStringValue(raw?.name, "Restaurante"),
    slug: toStringValue(raw?.slug),
    description: raw?.description ?? null,
    logoUrl: raw?.logoUrl ?? null,
    primaryColor: toStringValue(raw?.primaryColor, "#F97316"),
    secondaryColor: toStringValue(raw?.secondaryColor, "#111827"),
    whatsappNumber: toStringValue(raw?.whatsappNumber),
    plan: raw?.plan ?? "BASIC",
    isAiUpsellOn: Boolean(raw?.isAiUpsellOn ?? false),
    settings: raw?.settings ? normalizeRestaurantSettings(raw.settings) : null,
    categories: categories.map((category: any) => ({
      ...normalizeCategory(category),
      products: Array.isArray(category?.products)
        ? category.products.map((product: any) =>
            normalizeProduct({
              ...product,
              categoryId: product?.categoryId ?? category?.id,
              category: category ? normalizeCategory(category) : undefined
            })
          )
        : []
    }))
  };
}

export function normalizeCartItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const items: CartItem[] = [];

  for (const item of raw as any[]) {
    if (!item?.product) {
      continue;
    }

    const normalizedItem: CartItem = {
      product: normalizeProduct(item.product),
      quantity: toNumber(item.quantity, 1),
    };

    if (typeof item.notes === "string") {
      normalizedItem.notes = item.notes;
    }

    if (normalizedItem.quantity > 0) {
      items.push(normalizedItem);
    }
  }

  return items;
}

export function normalizeOrder(raw: any): Order {
  const items = Array.isArray(raw?.items)
    ? raw.items.map((item: any, index: number) => ({
        id: toStringValue(item?.id, `${raw?.id ?? "order"}-${index}`),
        quantity: toNumber(item?.quantity, 1),
        totalPrice: toNumber(item?.totalPrice),
        product: item?.product
          ? normalizeProduct(item.product)
          : {
              id: toStringValue(item?.productId, `${index}`),
              categoryId: "",
              name: toStringValue(item?.name, "Item removido"),
              description: "",
              imageUrl: null,
              price: toNumber(item?.unitPrice),
              compareAtPrice: null,
              isActive: true,
              isFeatured: false,
              productType: "SINGLE",
              tags: []
            }
      }))
    : [];

  return {
    id: toStringValue(raw?.id),
    customerName: toStringValue(raw?.customerName, "Cliente nao identificado"),
    customerPhone: raw?.customerPhone ?? null,
    customerAddress: raw?.customerAddress ?? null,
    paymentMethod: toStringValue(raw?.paymentMethod, "Nao informado"),
    notes: raw?.notes ?? null,
    subtotal: toNumber(raw?.subtotal),
    deliveryFee: toNumber(raw?.deliveryFee),
    total: toNumber(raw?.total),
    whatsappMessage: toStringValue(raw?.whatsappMessage),
    whatsappUrl: toStringValue(raw?.whatsappUrl),
    status: toStringValue(raw?.status, "PENDING"),
    createdAt: toStringValue(raw?.createdAt, new Date().toISOString()),
    items
  };
}

export function normalizeOnboarding(raw: any): OnboardingStatus {
  const stepsSource = Array.isArray(raw?.steps)
    ? raw.steps
    : Array.isArray(raw?.checklist)
      ? raw.checklist
      : [];

  const checklist: OnboardingStatus["checklist"] = stepsSource.map((item: any) => ({
    id: toStringValue(item?.id || item?.key, "step"),
    key: toStringValue(item?.key || item?.id, "step"),
    label: toStringValue(item?.label, "Etapa"),
    completed: Boolean(item?.completed ?? item?.done),
    helper: toStringValue(item?.helper, item?.done ? "Concluido" : "Pendente")
  }));

  const completedCount = checklist.filter((item) => item.completed).length;
  return {
    completed: Boolean(raw?.completed ?? (checklist.length > 0 && completedCount === checklist.length)),
    progress: toNumber(raw?.progress),
    estimatedSetupMinutes: toNumber(raw?.estimatedSetupMinutes, completedCount >= 2 ? 5 : 12),
    checklist
  };
}

export function normalizeInsights(raw: any): DashboardInsights {
  const summary = raw?.summary ?? {};
  const charts = raw?.charts ?? {};
  const topProducts = Array.isArray(raw?.topProducts) ? raw.topProducts : [];

  return {
    summary: {
      totalOrders: {
        day: toNumber(summary.totalOrders?.day),
        week: toNumber(summary.totalOrders?.week),
        month: toNumber(summary.totalOrders?.month)
      },
      totalRevenue: toNumber(summary.totalRevenue),
      monthlyRevenue: toNumber(summary.monthlyRevenue),
      averageTicket: toNumber(summary.averageTicket),
      conversionRate: toNumber(summary.conversionRate),
      savedFees: toNumber(summary.savedFees)
    },
    charts: {
      ordersByDay: Array.isArray(charts.ordersByDay)
        ? charts.ordersByDay.map((item: any) => ({
            date: toStringValue(item?.date),
            orders: toNumber(item?.orders)
          }))
        : [],
      peakHours: Array.isArray(charts.peakHours)
        ? charts.peakHours.map((item: any) => ({
            hour: toStringValue(item?.hour),
            orders: toNumber(item?.orders)
          }))
        : []
    },
    topProducts: topProducts.map((item: any, index: number) => ({
      id: toStringValue(item?.id, String(index + 1)),
      name: toStringValue(item?.name, "Produto"),
      quantity: toNumber(item?.quantity ?? item?.sales),
      revenue: toNumber(item?.revenue)
    })),
    topProfitableProducts: Array.isArray(raw?.topProfitableProducts)
      ? raw.topProfitableProducts.map((item: any) => ({
          name: toStringValue(item?.name, "Produto"),
          estimatedProfit: toNumber(item?.estimatedProfit)
        }))
      : [],
    fallbackUsed: Boolean(raw?.fallbackUsed)
  };
}

export function normalizeSettings(raw: any): RestaurantAdminSettings {
  return {
    restaurant: {
      name: toStringValue(raw?.restaurant?.name, "Don Burguer"),
      slug: toStringValue(raw?.restaurant?.slug, "don-burguer"),
      phone: toStringValue(raw?.restaurant?.phone, "5592999999999"),
      currency: toStringValue(raw?.restaurant?.currency, "BRL"),
      timezone: toStringValue(raw?.restaurant?.timezone, "America/Manaus"),
      deliveryFee: toNumber(raw?.restaurant?.deliveryFee),
      businessHours: toStringValue(raw?.restaurant?.businessHours, "Seg-Dom 11:00 as 23:00")
    },
    notifications: {
      email: Boolean(raw?.notifications?.email ?? true),
      whatsapp: Boolean(raw?.notifications?.whatsapp ?? true)
    },
    preferences: {
      autoAcceptOrders: Boolean(raw?.preferences?.autoAcceptOrders ?? false),
      showOutOfStock: Boolean(raw?.preferences?.showOutOfStock ?? false)
    },
    branding: {
      primaryColor: toStringValue(raw?.branding?.primaryColor, "#f97316"),
      secondaryColor: toStringValue(raw?.branding?.secondaryColor, "#111827"),
      logoUrl: toStringValue(raw?.branding?.logoUrl),
      bannerUrl: toStringValue(raw?.branding?.bannerUrl),
      heroTitle: toStringValue(raw?.branding?.heroTitle, "Seu restaurante"),
      heroSubtitle: toStringValue(raw?.branding?.heroSubtitle, "Seu cardapio com identidade propria"),
      seoTitle: toStringValue(raw?.branding?.seoTitle),
      seoDescription: toStringValue(raw?.branding?.seoDescription)
    }
  };
}

export function normalizeBillingSnapshot(raw: any): BillingSnapshot {
  const currentPlan = raw?.currentPlan ?? {};
  const availablePlans = Array.isArray(raw?.availablePlans) ? raw.availablePlans : [];

  return {
    currentPlan: {
      name: toStringValue(currentPlan?.name, "Pro"),
      price: toNumber(currentPlan?.price, 99.9),
      status: toStringValue(currentPlan?.status, "active")
    },
    availablePlans: availablePlans.map((plan: any): BillingPlan => ({
      id: toStringValue(plan?.id),
      name: toStringValue(plan?.name, "Plano"),
      price: toNumber(plan?.price ?? plan?.priceMonthly),
      currency: toStringValue(plan?.currency, "BRL"),
      features: Array.isArray(plan?.features) ? plan.features.map((feature: unknown) => String(feature)) : []
    }))
  };
}

export function normalizeFinanceSummary(raw: any): FinanceSummary {
  return {
    revenue: toNumber(raw?.revenue),
    estimatedProfit: toNumber(raw?.estimatedProfit),
    averageTicket: toNumber(raw?.averageTicket),
    totalOrders: toNumber(raw?.totalOrders)
  };
}

export function normalizeCustomer(raw: any): Customer {
  return {
    id: toStringValue(raw?.id),
    name: toStringValue(raw?.name, "Cliente"),
    phone: raw?.phone ?? null,
    totalOrders: toNumber(raw?.totalOrders),
    totalSpent: toNumber(raw?.totalSpent),
    lastOrderDate: raw?.lastOrderDate ?? null,
    averageTicket: toNumber(raw?.averageTicket),
    frequencyDays: raw?.frequencyDays == null ? null : toNumber(raw?.frequencyDays),
    isVip: Boolean(raw?.isVip),
    segment: raw?.segment ?? "novo",
    recentOrders: Array.isArray(raw?.recentOrders)
      ? raw.recentOrders.map((order: any) => ({
          id: toStringValue(order?.id),
          total: toNumber(order?.total),
          createdAt: toStringValue(order?.createdAt),
          status: toStringValue(order?.status)
        }))
      : []
  };
}

export function normalizeLoyalty(raw: any): LoyaltySummary {
  return {
    customerId: toStringValue(raw?.customerId),
    customerName: toStringValue(raw?.customerName),
    points: toNumber(raw?.points),
    nextRewardAt: toNumber(raw?.nextRewardAt),
    progress: toNumber(raw?.progress),
    rewards: Array.isArray(raw?.rewards) ? raw.rewards.map((reward: unknown) => String(reward)) : []
  };
}

export function normalizePromotion(raw: any): Promotion {
  return {
    id: toStringValue(raw?.id),
    title: toStringValue(raw?.title, "Promocao"),
    type: toStringValue(raw?.type, "discount"),
    value: toNumber(raw?.value),
    active: Boolean(raw?.active ?? true),
    description: raw?.description ?? null,
    productId: raw?.productId ?? null,
    productName: raw?.productName ?? null,
    originalPrice: raw?.originalPrice == null ? undefined : toNumber(raw?.originalPrice)
  };
}
