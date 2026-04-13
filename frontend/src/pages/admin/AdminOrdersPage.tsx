import { useEffect, useMemo, useState } from "react";
import { fetchOrders, updateOrderStatus } from "../../api/orders";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { SectionHeading } from "../../components/SectionHeading";
import { StatusChip } from "../../components/StatusChip";
import type { Order } from "../../types";
import { formatCurrency } from "../../utils/currency";
import { formatManausDateTime } from "../../utils/date";

const statusFilters = [
  { label: "Todos", value: "ALL" },
  { label: "Pendente", value: "PENDING" },
  { label: "Preparando", value: "PREPARING" },
  { label: "Pronto", value: "READY" },
  { label: "Entregue", value: "DELIVERED" },
  { label: "Cancelado", value: "CANCELLED" }
] as const;

export function AdminOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeStatus, setActiveStatus] = useState<(typeof statusFilters)[number]["value"]>("ALL");

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar os pedidos.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const normalized = [...orders].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    if (activeStatus === "ALL") {
      return normalized;
    }

    return normalized.filter((order) => order.status === activeStatus);
  }, [activeStatus, orders]);

  const counts = useMemo(
    () =>
      orders.reduce<Record<string, number>>((accumulator, order) => {
        accumulator[order.status] = (accumulator[order.status] ?? 0) + 1;
        return accumulator;
      }, {}),
    [orders]
  );

  async function handleStatusUpdate(orderId: string, status: string) {
    const updated = await updateOrderStatus(orderId, status);
    setOrders((current) => current.map((order) => (order.id === orderId ? updated : order)));
  }

  return (
    <div className="space-y-6">
      <SectionHeading title="Pedidos" subtitle="Historico simulado salvo no banco e enviado para WhatsApp." />
      <div className="flex flex-wrap gap-3">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveStatus(filter.value)}
            className={
              activeStatus === filter.value
                ? "rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white"
                : "rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300"
            }
          >
            {filter.label}{" "}
            <span className="text-xs text-slate-200">
              {filter.value === "ALL" ? orders.length : counts[filter.value] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {error ? (
        <EmptyState
          title="Pedidos indisponiveis"
          description={error}
          actionLabel="Recarregar pedidos"
          onAction={() => void loadOrders()}
          tone="error"
        />
      ) : null}

      <div className="grid gap-4">
        {!loading && filteredOrders.length === 0 ? (
          <EmptyState
            title="Nenhum pedido nesta fila"
            description="Quando os clientes finalizarem o checkout, os pedidos aparecerao aqui."
          />
        ) : null}

        {filteredOrders.map((order) => (
          <article key={order.id} className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">Pedido #{order.id.slice(-6).toUpperCase()}</p>
                <h3 className="text-lg font-bold text-white">{order.customerName}</h3>
                <p className="text-sm text-slate-400">
                  {order.paymentMethod} • {formatManausDateTime(order.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-brand">{formatCurrency(order.total)}</div>
                <div className="mt-2">
                  <StatusChip status={order.status} />
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              {order.items.map((item) => (
                <div key={item.id}>
                  {item.product.name || "Item sem nome"} x{item.quantity}
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <div className="text-sm text-slate-400">
                {order.customerPhone || "Telefone nao informado"}
                {order.customerAddress ? ` • ${order.customerAddress}` : ""}
              </div>
              <div className="flex flex-wrap gap-2">
                {statusFilters
                  .filter((status) => status.value !== "ALL")
                  .map((status) => (
                    <Button
                      key={status.value}
                      className="bg-white/10 px-3 py-2 text-xs text-white shadow-none"
                      onClick={() => void handleStatusUpdate(order.id, status.value)}
                    >
                      {status.label}
                    </Button>
                  ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
