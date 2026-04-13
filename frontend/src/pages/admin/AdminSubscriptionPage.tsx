import { useEffect, useState } from "react";
import { fetchPlans } from "../../api/billing";
import { EmptyState } from "../../components/EmptyState";
import { SectionHeading } from "../../components/SectionHeading";
import { formatCurrency } from "../../utils/currency";
import type { BillingSnapshot } from "../../types";

export function AdminSubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [billing, setBilling] = useState<BillingSnapshot | null>(null);

  async function loadBilling() {
    setLoading(true);
    setError("");
    try {
      setBilling(await fetchPlans());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar os planos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBilling();
  }, []);

  return (
    <div className="space-y-6">
      <SectionHeading title="Billing" subtitle="Simulacao comercial pronta para precificacao SaaS." />
      {billing ? (
        <div className="rounded-[28px] border border-emerald-500/20 bg-emerald-500/10 p-5">
          <p className="text-sm text-emerald-300">Plano atual</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-3xl font-black text-white">{billing.currentPlan.name}</h3>
              <p className="mt-1 text-sm text-slate-300">Status: {billing.currentPlan.status}</p>
            </div>
            <div className="text-2xl font-black text-white">{formatCurrency(billing.currentPlan.price)}/mes</div>
          </div>
        </div>
      ) : null}
      {error ? (
        <EmptyState
          title="Billing indisponivel"
          description={error}
          actionLabel="Recarregar planos"
          onAction={() => void loadBilling()}
          tone="error"
        />
      ) : null}
      <div className="grid gap-4 md:grid-cols-3">
        {billing?.availablePlans.map((plan) => (
          <article key={plan.id} className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <h3 className="text-2xl font-black text-white">{plan.name}</h3>
            <p className="mt-3 text-3xl font-black text-emerald-400">{formatCurrency(plan.price)}/mes</p>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              {(plan.features.length > 0
                ? plan.features
                : ["Setup assistido", "Painel administrativo", "Suporte via WhatsApp"]
              ).map((feature) => (
                <p key={feature}>{feature}</p>
              ))}
            </div>
            <button className="mt-6 w-full rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950">
              Simular upgrade
            </button>
          </article>
        ))}
        {!loading && !billing?.availablePlans.length ? (
          <div className="md:col-span-3">
            <EmptyState title="Nenhum plano encontrado" description="Os planos aparecerao aqui quando o billing estiver configurado." />
          </div>
        ) : null}
      </div>
    </div>
  );
}
