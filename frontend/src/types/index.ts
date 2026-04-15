export type ApiMoneyValue = number | string | null;

export type ApiProduct = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  price: ApiMoneyValue;
  costPrice?: ApiMoneyValue;
  compareAtPrice?: ApiMoneyValue;
  stockQuantity?: number | string | null;
  isActive: boolean;
  isFeatured: boolean;
  productType: "SINGLE" | "COMBO" | "ADDON";
  tags: string[];
  category?: ApiCategory;
  promotionalPrice?: ApiMoneyValue;
  promotion?: ApiPromotion | null;
};

export type ApiCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number | string;
  isActive: boolean;
  products?: ApiProduct[];
};

export type ApiRestaurantSettings = {
  heroTitle: string;
  heroSubtitle: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  deliveryFee: ApiMoneyValue;
  minimumOrderAmount: ApiMoneyValue;
  estimatedTimeMin: number | string;
  estimatedTimeMax: number | string;
  bannerUrl?: string | null;
};

export type ApiRestaurant = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  whatsappNumber: string;
  plan: "BASIC" | "PRO" | "PREMIUM";
  isAiUpsellOn: boolean;
  settings?: ApiRestaurantSettings | null;
  categories?: ApiCategory[];
};

export type ApiPromotion = {
  id: string;
  title: string;
  type: string;
  value: ApiMoneyValue;
  active: boolean;
  description?: string | null;
  productId?: string | null;
  categoryId?: string | null;
  productName?: string | null;
  categoryName?: string | null;
  minimumOrderAmount?: ApiMoneyValue;
  highlightLabel?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  originalPrice?: ApiMoneyValue;
  promotionalPrice?: ApiMoneyValue;
};

export type Product = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  price: number;
  costPrice?: number | null;
  compareAtPrice?: number | null;
  stockQuantity?: number;
  isActive: boolean;
  isFeatured: boolean;
  productType: "SINGLE" | "COMBO" | "ADDON";
  tags: string[];
  category?: Category;
  promotionalPrice?: number | null;
  promotion?: Promotion | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  products?: Product[];
};

export type RestaurantSettings = {
  heroTitle: string;
  heroSubtitle: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  deliveryFee: number;
  minimumOrderAmount: number;
  estimatedTimeMin: number;
  estimatedTimeMax: number;
  bannerUrl?: string | null;
};

export type Restaurant = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  whatsappNumber: string;
  plan: "BASIC" | "PRO" | "PREMIUM";
  isAiUpsellOn: boolean;
  settings?: RestaurantSettings | null;
  categories?: Category[];
};

export type PublicMenuResponse = Restaurant;
export type ApiPublicMenuResponse = ApiRestaurant;

export type CartItem = {
  product: Product;
  quantity: number;
  notes?: string;
};

export type Order = {
  id: string;
  customerName: string;
  customerPhone?: string | null;
  customerAddress?: string | null;
  fulfillmentType?: string | null;
  paymentMethod: string;
  notes?: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  whatsappMessage: string;
  whatsappUrl: string;
  status: string;
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    totalPrice: number;
    product: Product;
  }>;
};

export type LoginResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  restaurant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  };
};

export type AuthenticatedUser = LoginResponse["user"] & {
  restaurantId: string;
  restaurant: LoginResponse["restaurant"];
};

export type InsightSummary = {
  totalOrders: {
    day: number;
    week: number;
    month: number;
  };
  totalRevenue: number;
  monthlyRevenue: number;
  conversionRate: number;
  averageTicket: number;
  savedFees: number;
};

export type OnboardingStatus = {
  completed: boolean;
  progress: number;
  estimatedSetupMinutes: number;
  checklist: Array<{
    id: string;
    key: string;
    label: string;
    completed: boolean;
    helper: string;
  }>;
};

export type BillingPlan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
};

export type BillingSnapshot = {
  currentPlan: {
    name: string;
    price: number;
    status: string;
  };
  availablePlans: BillingPlan[];
};

export type WhatsappTemplate = {
  id: string;
  name: string;
  category: string;
  content: string;
  suggestedAudience?: number;
  actionLabel?: string;
};

export type DashboardInsights = {
  summary: InsightSummary;
  charts: {
    ordersByDay: Array<{ date: string; orders: number }>;
    peakHours: Array<{ hour: string; orders: number }>;
  };
  topProducts: Array<{ id: string; name: string; quantity: number; revenue: number }>;
  topProfitableProducts: Array<{ name: string; estimatedProfit: number }>;
  fallbackUsed: boolean;
};

export type RestaurantAdminSettings = {
  restaurant: {
    name: string;
    slug: string;
    phone: string;
    currency: string;
    timezone: string;
    deliveryFee?: number;
    businessHours?: string;
  };
  notifications: {
    email: boolean;
    whatsapp: boolean;
  };
  preferences: {
    autoAcceptOrders: boolean;
    showOutOfStock: boolean;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
    bannerUrl: string;
    heroTitle: string;
    heroSubtitle: string;
    seoTitle: string;
    seoDescription: string;
  };
};

export type FinanceSummary = {
  revenue: number;
  estimatedProfit: number;
  averageTicket: number;
  totalOrders: number;
};

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
  averageTicket: number;
  frequencyDays: number | null;
  isVip: boolean;
  segment: "vip" | "recorrente" | "novo";
  recentOrders: Array<{
    id: string;
    total: number;
    createdAt: string;
    status: string;
  }>;
};

export type LoyaltySummary = {
  customerId: string;
  customerName: string;
  points: number;
  nextRewardAt: number;
  progress: number;
  rewards: string[];
};

export type StockAlert = {
  id: string;
  name: string;
  stockQuantity: number;
  soldLast30Days: number;
  status: "low" | "critical" | "ok";
  coverageDays: number;
  valueAtRisk: number;
};

export type StockAlertsResponse = {
  alerts: StockAlert[];
  summary: {
    totalTracked: number;
    lowStock: number;
    criticalStock: number;
  };
};

export type Promotion = {
  id: string;
  title: string;
  type: string;
  value: number;
  active: boolean;
  description?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  productId?: string | null;
  productName?: string | null;
  minimumOrderAmount?: number | null;
  highlightLabel?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  originalPrice?: number | null;
  promotionalPrice?: number | null;
};
