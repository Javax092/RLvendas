import type { Prisma } from "@prisma/client";
import { toSafeNumber, type NumericValue } from "./money.js";

type SerializableCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
};

type SerializableProduct = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  price: NumericValue;
  costPrice?: NumericValue;
  compareAtPrice?: NumericValue;
  stockQuantity?: number;
  isActive: boolean;
  isFeatured: boolean;
  productType: string;
  tags?: string[];
  category?: SerializableCategory | null;
};

type SerializableCategoryWithProducts = SerializableCategory & {
  products?: SerializableProduct[];
};

type SerializableRestaurantSettings = {
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  bannerUrl?: string | null;
  deliveryFee?: NumericValue;
  minimumOrderAmount?: NumericValue;
  estimatedTimeMin?: number | null;
  estimatedTimeMax?: number | null;
  autoAcceptOrders?: boolean | null;
  businessHours?: string | null;
};

type SerializableRestaurant = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  whatsappNumber: string;
  plan: string;
  isAiUpsellOn: boolean;
  settings?: SerializableRestaurantSettings | null;
  categories?: SerializableCategoryWithProducts[];
};

type SerializableOrderProduct = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  price: NumericValue;
  costPrice?: NumericValue;
  compareAtPrice?: NumericValue;
  stockQuantity?: number;
  isActive: boolean;
  isFeatured: boolean;
  productType: string;
  tags?: string[];
};

type SerializableOrderItem = {
  id: string;
  quantity: number;
  unitPrice: NumericValue;
  totalPrice: NumericValue;
  notes?: string | null;
  product: SerializableOrderProduct;
};

type SerializableOrder = {
  id: string;
  customerName: string;
  customerPhone?: string | null;
  customerAddress?: string | null;
  paymentMethod: string;
  notes?: string | null;
  subtotal: NumericValue;
  deliveryFee: NumericValue;
  total: NumericValue;
  whatsappMessage: string;
  whatsappUrl: string;
  status: string;
  createdAt: Date;
  items?: SerializableOrderItem[];
};

export function serializeCategory(category: SerializableCategory) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? null,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
  };
}

export function serializeProduct(product: SerializableProduct) {
  return {
    id: product.id,
    categoryId: product.categoryId,
    name: product.name,
    description: product.description,
    imageUrl: product.imageUrl ?? null,
    price: toSafeNumber(product.price),
    costPrice: product.costPrice == null ? null : toSafeNumber(product.costPrice),
    compareAtPrice: product.compareAtPrice == null ? null : toSafeNumber(product.compareAtPrice),
    stockQuantity: product.stockQuantity ?? 0,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    productType: product.productType,
    tags: Array.isArray(product.tags) ? product.tags : [],
    category: product.category ? serializeCategory(product.category) : undefined,
  };
}

export function serializeRestaurantSettings(settings?: SerializableRestaurantSettings | null) {
  if (!settings) {
    return null;
  }

  return {
    heroTitle: settings.heroTitle ?? "",
    heroSubtitle: settings.heroSubtitle ?? "",
    seoTitle: settings.seoTitle ?? null,
    seoDescription: settings.seoDescription ?? null,
    bannerUrl: settings.bannerUrl ?? null,
    deliveryFee: toSafeNumber(settings.deliveryFee),
    minimumOrderAmount: toSafeNumber(settings.minimumOrderAmount),
    estimatedTimeMin: settings.estimatedTimeMin ?? 30,
    estimatedTimeMax: settings.estimatedTimeMax ?? 45,
    autoAcceptOrders: Boolean(settings.autoAcceptOrders ?? false),
    businessHours: settings.businessHours ?? null,
  };
}

export function serializeRestaurant(restaurant: SerializableRestaurant) {
  return {
    id: restaurant.id,
    name: restaurant.name,
    slug: restaurant.slug,
    description: restaurant.description ?? null,
    logoUrl: restaurant.logoUrl ?? null,
    primaryColor: restaurant.primaryColor,
    secondaryColor: restaurant.secondaryColor,
    whatsappNumber: restaurant.whatsappNumber,
    plan: restaurant.plan,
    isAiUpsellOn: restaurant.isAiUpsellOn,
    settings: serializeRestaurantSettings(restaurant.settings),
    categories: Array.isArray(restaurant.categories)
      ? restaurant.categories.map((category) => ({
          ...serializeCategory(category),
          products: Array.isArray(category.products)
            ? category.products.map((product) =>
                serializeProduct({
                  ...product,
                  categoryId: product.categoryId ?? category.id,
                }),
              )
            : [],
        }))
      : [],
  };
}

export function serializeOrder(order: SerializableOrder) {
  return {
    id: order.id,
    customerName: order.customerName,
    customerPhone: order.customerPhone ?? null,
    customerAddress: order.customerAddress ?? null,
    paymentMethod: order.paymentMethod,
    notes: order.notes ?? null,
    subtotal: toSafeNumber(order.subtotal),
    deliveryFee: toSafeNumber(order.deliveryFee),
    total: toSafeNumber(order.total),
    whatsappMessage: order.whatsappMessage,
    whatsappUrl: order.whatsappUrl,
    status: order.status,
    createdAt: order.createdAt,
    items: Array.isArray(order.items)
      ? order.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          unitPrice: toSafeNumber(item.unitPrice),
          totalPrice: toSafeNumber(item.totalPrice),
          notes: item.notes ?? null,
          product: serializeProduct(item.product),
        }))
      : [],
  };
}

export type ProductWithCategory = Prisma.ProductGetPayload<{
  include: { category: true };
}>;

export type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: { include: { product: true } } };
}>;
