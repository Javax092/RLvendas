import { getOrderRevenue, getProductCost, getRestaurantOrders, numberValue } from "./restaurant-analytics.js";

export async function buildFinanceSummary(restaurantId: string) {
  const orders = await getRestaurantOrders(restaurantId);
  const validOrders = orders.filter((order) => order.status !== "CANCELLED");

  const revenue = validOrders.reduce((sum, order) => sum + getOrderRevenue(order), 0);
  const totalOrders = validOrders.length;
  const averageTicket = totalOrders > 0 ? revenue / totalOrders : 0;

  const estimatedProfit = validOrders.reduce((sum, order) => {
    const itemsProfit = order.items.reduce((itemsSum, item) => {
      const unitCost = getProductCost(item.product);
      return itemsSum + (numberValue(item.totalPrice) - unitCost * item.quantity);
    }, 0);

    return sum + itemsProfit;
  }, 0);

  return {
    revenue,
    estimatedProfit,
    averageTicket,
    totalOrders
  };
}
