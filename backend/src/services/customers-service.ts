import { buildCustomerId, getOrderRevenue, getRestaurantOrders, numberValue } from "./restaurant-analytics.js";

export type AggregatedCustomer = {
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

export async function buildCustomersRanking(restaurantId: string) {
  const orders = await getRestaurantOrders(restaurantId);
  const customersMap = new Map<string, AggregatedCustomer>();

  for (const order of orders) {
    if (order.status === "CANCELLED") {
      continue;
    }

    const customerId = buildCustomerId(order.customerName, order.customerPhone);
    const previous = customersMap.get(customerId) ?? {
      id: customerId,
      name: order.customerName,
      phone: order.customerPhone ?? null,
      totalOrders: 0,
      totalSpent: 0,
      lastOrderDate: null,
      averageTicket: 0,
      frequencyDays: null,
      isVip: false,
      segment: "novo" as const,
      recentOrders: []
    };

    previous.totalOrders += 1;
    previous.totalSpent += getOrderRevenue(order);
    previous.lastOrderDate =
      !previous.lastOrderDate || order.createdAt.toISOString() > previous.lastOrderDate
        ? order.createdAt.toISOString()
        : previous.lastOrderDate;
    previous.recentOrders.push({
      id: order.id,
      total: numberValue(order.total),
      createdAt: order.createdAt.toISOString(),
      status: order.status
    });

    customersMap.set(customerId, previous);
  }

  return [...customersMap.values()]
    .map((customer) => {
      const sortedOrders = [...customer.recentOrders].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
      const firstOrder = sortedOrders[sortedOrders.length - 1];
      const lastOrder = sortedOrders[0];
      const frequencyDays =
        firstOrder && lastOrder && firstOrder.createdAt !== lastOrder.createdAt
          ? Math.max(
              1,
              Math.round(
                (new Date(lastOrder.createdAt).getTime() - new Date(firstOrder.createdAt).getTime()) /
                  (1000 * 60 * 60 * 24) /
                  customer.totalOrders
              )
            )
          : null;
      const averageTicket = customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0;
      const isVip = customer.totalOrders >= 3 || customer.totalSpent >= 150;
      return {
        ...customer,
        averageTicket,
        frequencyDays,
        isVip,
        segment: isVip ? "vip" : customer.totalOrders >= 2 ? "recorrente" : "novo",
        recentOrders: sortedOrders.slice(0, 5)
      };
    })
    .sort((left, right) => right.totalSpent - left.totalSpent);
}

export async function getCustomerById(restaurantId: string, customerId: string) {
  const customers = await buildCustomersRanking(restaurantId);
  return customers.find((customer) => customer.id === customerId) ?? null;
}
