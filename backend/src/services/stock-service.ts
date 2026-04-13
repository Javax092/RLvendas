import { getRestaurantOrders, getRestaurantProducts, numberValue } from "./restaurant-analytics.js";

export async function buildStockAlerts(restaurantId: string) {
  const [products, orders] = await Promise.all([getRestaurantProducts(restaurantId), getRestaurantOrders(restaurantId)]);
  const salesMap = new Map<string, number>();

  for (const order of orders) {
    if (order.status === "CANCELLED") {
      continue;
    }
    for (const item of order.items) {
      salesMap.set(item.productId, (salesMap.get(item.productId) ?? 0) + item.quantity);
    }
  }

  const items = products.map((product) => {
    const sold = salesMap.get(product.id) ?? 0;
    const baseStock = product.stockQuantity > 0 ? product.stockQuantity : Math.max(8, 40 - sold * 2);
    const status = baseStock <= 5 ? "critical" : baseStock <= 12 ? "low" : "ok";
    return {
      id: product.id,
      name: product.name,
      stockQuantity: baseStock,
      soldLast30Days: sold,
      status,
      coverageDays: sold > 0 ? Math.round(baseStock / Math.max(1, sold / 30)) : 30,
      valueAtRisk: baseStock * numberValue(product.price)
    };
  });

  return {
    alerts: items.filter((item) => item.status !== "ok").sort((left, right) => left.stockQuantity - right.stockQuantity),
    summary: {
      totalTracked: items.length,
      lowStock: items.filter((item) => item.status === "low").length,
      criticalStock: items.filter((item) => item.status === "critical").length
    }
  };
}
