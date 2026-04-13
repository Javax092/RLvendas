import { useEffect, useState } from "react";
import { fetchCustomers, fetchLoyalty } from "../../api/customers";
import { EmptyState } from "../../components/EmptyState";
import { SectionHeading } from "../../components/SectionHeading";
import type { Customer, LoyaltySummary } from "../../types";
import { formatCurrency } from "../../utils/currency";
import { formatManausDateTime } from "../../utils/date";

export function AdminCustomersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [loyalty, setLoyalty] = useState<LoyaltySummary | null>(null);

  async function loadCustomers() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchCustomers();
      setCustomers(data);
      const defaultCustomerId = data[0]?.id ?? "";
      setSelectedCustomerId(defaultCustomerId);
      if (defaultCustomerId) {
        try {
          setLoyalty(await fetchLoyalty(defaultCustomerId));
        } catch {
          setLoyalty(null);
        }
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar os clientes.");
      setCustomers([]);
      setLoyalty(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectCustomer(customerId: string) {
    setSelectedCustomerId(customerId);
    try {
      setLoyalty(await fetchLoyalty(customerId));
    } catch {
      setLoyalty(null);
    }
  }

  useEffect(() => {
    void loadCustomers();
  }, []);

  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId);

  return (
    <div className="space-y-6">
      <SectionHeading title="Clientes" subtitle="CRM simples com ranking, segmentacao e fidelidade." />

      {error ? (
        <EmptyState
          title="Clientes indisponiveis"
          description={error}
          actionLabel="Recarregar clientes"
          onAction={() => void loadCustomers()}
          tone="error"
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <h3 className="text-lg font-bold text-white">Ranking de clientes</h3>
          <div className="mt-4 space-y-3">
            {!loading && customers.length === 0 ? (
              <EmptyState
                title="Nenhum cliente ainda"
                description="Os clientes passam a aparecer automaticamente conforme os pedidos entram."
              />
            ) : null}

            {customers.map((customer, index) => (
              <button
                key={customer.id}
                onClick={() => void handleSelectCustomer(customer.id)}
                className={
                  selectedCustomerId === customer.id
                    ? "w-full rounded-2xl border border-brand bg-brand/10 p-4 text-left"
                    : "w-full rounded-2xl border border-white/10 p-4 text-left"
                }
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">#{index + 1}</p>
                    <p className="font-semibold text-white">{customer.name}</p>
                    <p className="text-sm text-slate-400">{customer.phone || "Telefone nao informado"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-brand">{formatCurrency(customer.totalSpent)}</p>
                    <p className="text-sm text-slate-400">{customer.totalOrders} pedidos</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">{customer.segment}</span>
                  {customer.isVip ? (
                    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs text-amber-300">VIP</span>
                  ) : null}
                  {customer.frequencyDays ? (
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                      recompra a cada {customer.frequencyDays} dias
                    </span>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <h3 className="text-lg font-bold text-white">Fidelidade</h3>
            {loyalty ? (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm text-slate-400">{loyalty.customerName}</p>
                  <p className="mt-2 text-3xl font-black text-white">{loyalty.points} pontos</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${loyalty.progress}%` }} />
                </div>
                <p className="text-sm text-slate-400">Proxima recompensa em {loyalty.nextRewardAt} pontos.</p>
                <div className="space-y-2">
                  {loyalty.rewards.length > 0 ? (
                    loyalty.rewards.map((reward) => (
                      <div key={reward} className="rounded-2xl border border-white/10 p-3 text-sm text-slate-300">
                        {reward}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">Ainda sem recompensas liberadas.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">Selecione um cliente para ver a fidelidade.</p>
            )}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <h3 className="text-lg font-bold text-white">Resumo do cliente</h3>
            {selectedCustomer ? (
              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <p>Ticket medio: {formatCurrency(selectedCustomer.averageTicket)}</p>
                <p>
                  Ultimo pedido:{" "}
                  {selectedCustomer.lastOrderDate ? formatManausDateTime(selectedCustomer.lastOrderDate) : "sem historico"}
                </p>
                <p>Pedidos totais: {selectedCustomer.totalOrders}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">Sem cliente selecionado.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
