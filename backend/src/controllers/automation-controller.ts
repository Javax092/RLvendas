import type { Request, Response } from "express";
import { buildCustomersRanking } from "../services/customers-service.js";
import { ok } from "../utils/api-response.js";

export async function listWhatsappTemplates(request: Request, response: Response) {
  const customers = await buildCustomersRanking(request.user!.restaurantId);
  const inactiveCustomers = customers.filter((customer) => {
    if (!customer.lastOrderDate) {
      return false;
    }
    const daysSinceLastOrder = Math.floor(
      (Date.now() - new Date(customer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceLastOrder >= 7;
  }).length;

  const templates = [
    {
      id: "1",
      name: "Boas-vindas",
      category: "welcome",
      content: "Ola! Seja bem-vindo ao nosso cardapio digital.",
      suggestedAudience: Math.max(3, customers.length),
      actionLabel: "Enviar campanha"
    },
    {
      id: "2",
      name: "Recuperacao de carrinho",
      category: "recovery",
      content: "Percebemos que voce nao concluiu seu pedido. Posso te ajudar?",
      suggestedAudience: Math.max(2, Math.round(customers.length * 0.35)),
      actionLabel: "Reengajar clientes"
    },
    {
      id: "3",
      name: "Reativacao de cliente",
      category: "reactivation",
      content: "Sentimos sua falta. Hoje voce ganha um incentivo especial para voltar a pedir.",
      suggestedAudience: inactiveCustomers,
      actionLabel: "Recuperar inativos"
    },
    {
      id: "4",
      name: "Upsell do dia",
      category: "upsell",
      content: "Quer turbinar seu pedido com fritas crocantes e bebida gelada?",
      suggestedAudience: Math.max(4, customers.length),
      actionLabel: "Disparar upsell"
    }
  ];

  return response.json(ok({ automationEnabled: true, templates }));
}
