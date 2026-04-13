import { getCustomerById } from "./customers-service.js";

export async function buildLoyaltySummary(restaurantId: string, customerId: string) {
  const customer = await getCustomerById(restaurantId, customerId);

  if (!customer) {
    return null;
  }

  const points = customer.totalOrders * 10 + Math.floor(customer.totalSpent / 10);
  const nextRewardAt = Math.ceil((points + 1) / 100) * 100;
  const rewards = [];

  if (points >= 100) {
    rewards.push("Batata media gratis");
  }
  if (points >= 200) {
    rewards.push("Combo com 15% off");
  }
  if (points >= 300) {
    rewards.push("Burger premium por conta da casa");
  }

  return {
    customerId: customer.id,
    customerName: customer.name,
    points,
    nextRewardAt,
    progress: nextRewardAt > 0 ? Math.min(100, Math.round((points / nextRewardAt) * 100)) : 0,
    rewards
  };
}
