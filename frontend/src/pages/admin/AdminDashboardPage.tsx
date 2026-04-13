import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchInsights } from "../../api/insights";
import { fetchOnboardingStatus } from "../../api/onboarding";
import { fetchWhatsappTemplates } from "../../api/automations";
import { fetchFinanceSummary } from "../../api/finance";
import { fetchPromotions } from "../../api/promotions";
import { EmptyState } from "../../components/EmptyState";
import { useAuth } from "../../hooks/useAuth";
import { formatCurrency } from "../../utils/currency";
import { MetricCard } from "../../components/MetricCard";
import { OnboardingChecklist } from "../../components/OnboardingChecklist";
import { SectionHeading } from "../../components/SectionHeading";
import { SkeletonCard } from "../../components/SkeletonCard";
import type { DashboardInsights, FinanceSummary, OnboardingStatus, Promotion, WhatsappTemplate } from "../../types";

export function AdminDashboardPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [primaryError, setPrimaryError] = useState("");
  const [onboarding, setOnboarding] = useState<OnboardingStatus | null>(null);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([]);
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  async function loadDashboard() {
    setLoading(true);
    setPrimaryError("");

    const [onboardingResult, insightsResult, templatesResult, financeResult, promotionsResult] = await Promise.allSettled([
      fetchOnboardingStatus(),
      fetchInsights(),
      fetchWhatsappTemplates(),
      fetchFinanceSummary(),
      fetchPromotions()
    ]);

    if (onboardingResult.status === "fulfilled") {
      setOnboarding(onboardingResult.value);
    } else {
      setOnboarding(null);
    }

    if (insightsResult.status === "fulfilled") {
      setInsights(insightsResult.value);
    } else {
      setInsights(null);
      setPrimaryError(insightsResult.reason?.message ?? "Nao foi possivel carregar os indicadores.");
    }

    if (templatesResult.status === "fulfilled") {
      setTemplates(templatesResult.value);
    } else {
      setTemplates([]);
    }

    if (financeResult.status === "fulfilled") {
      setFinance(financeResult.value);
    } else {
      setFinance(null);
    }

    if (promotionsResult.status === "fulfilled") {
      setPromotions(promotionsResult.value);
    } else {
      setPromotions([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-brand/20 via-slate-900 to-slate-950 p-6">
        <p className="text-sm text-brand">Restaurante ativo</p>
        <h1 className="mt-2 text-4xl font-black text-white">{session?.restaurant.name}</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          Plataforma pronta para vender sem taxa de marketplace, com checkout por WhatsApp e base preparada
          para assinaturas SaaS.
        </p>
        <Link to={`/${session?.restaurant.slug}`} className="mt-6 inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950">
          Abrir cardapio publico
        </Link>
      </section>

      {onboarding ? <OnboardingChecklist data={onboarding} onPrimaryAction={() => navigate("/admin/products")} /> : null}

      {primaryError ? (
        <EmptyState
          title="Indicadores indisponiveis"
          description={primaryError}
          actionLabel="Tentar novamente"
          onAction={() => void loadDashboard()}
          tone="error"
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <MetricCard
              label="Pedidos do dia"
              value={String(insights?.summary.totalOrders.day || 0)}
              helper={`Semana: ${insights?.summary.totalOrders.week || 0} pedidos`}
            />
            <MetricCard
              label="Faturamento"
              value={formatCurrency(finance?.revenue || insights?.summary.totalRevenue || 0)}
              helper={`Mes: ${formatCurrency(insights?.summary.monthlyRevenue || 0)}`}
            />
            <MetricCard
              label="Ticket medio"
              value={formatCurrency(finance?.averageTicket || insights?.summary.averageTicket || 0)}
              helper={`Conversao estimada: ${insights?.summary.conversionRate || 0}%`}
            />
            <MetricCard
              label="Lucro estimado"
              value={formatCurrency(finance?.estimatedProfit || 0)}
              helper={`Economia vs marketplace: ${formatCurrency(insights?.summary.savedFees || 0)}`}
            />
          </>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <SectionHeading title="Produtos mais vendidos" subtitle="Ranking para orientar promos e destaque no cardapio." />
          <div className="mt-5 space-y-3">
            {insights?.topProducts && insights.topProducts.length > 0 ? (
              insights.topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between rounded-2xl border border-white/10 p-4">
                  <div>
                    <p className="text-sm text-slate-500">#{index + 1}</p>
                    <p className="font-semibold text-white">{product.name}</p>
                    <p className="text-sm text-slate-400">{product.quantity} unidades vendidas</p>
                  </div>
                  <div className="text-right text-emerald-400">{formatCurrency(product.revenue)}</div>
                </div>
              ))
            ) : (
              <p className="mt-4 text-sm text-slate-400">Os dados aparecerao apos os primeiros pedidos.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <SectionHeading title="Produtos mais lucrativos" subtitle="Margem estimada para orientar mix e precificacao." />
            <div className="mt-4 space-y-3">
              {(insights?.topProfitableProducts ?? []).map((product) => (
                <div key={product.name} className="flex items-center justify-between rounded-2xl border border-white/10 p-4">
                  <p className="font-medium text-white">{product.name}</p>
                  <p className="text-emerald-300">{formatCurrency(product.estimatedProfit)}</p>
                </div>
              ))}
              {!(insights?.topProfitableProducts.length ?? 0) ? (
                <p className="text-sm text-slate-400">As margens aparecem conforme os custos entram no catalogo.</p>
              ) : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <SectionHeading title="Automacao WhatsApp" subtitle="Templates fake, mas criveis para demos comerciais." />
            <div className="mt-4 space-y-3">
              {templates.map((template) => (
                <div key={template.id} className="rounded-2xl border border-white/10 p-4">
                  <p className="font-semibold text-white">{template.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-emerald-300">{template.category}</p>
                  <p className="mt-2 text-sm text-slate-400">{template.content}</p>
                </div>
              ))}
              {templates.length === 0 ? (
                <p className="text-sm text-slate-400">Os templates sao opcionais e podem ser carregados depois.</p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <SectionHeading title="Horarios de pico" subtitle="Base para escala e campanhas com maior conversao." />
          <div className="mt-4 space-y-3">
            {(insights?.charts.peakHours ?? []).map((item) => (
              <div key={item.hour}>
                <div className="mb-1 flex items-center justify-between text-sm text-slate-300">
                  <span>{item.hour}</span>
                  <span>{item.orders} pedidos</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, item.orders * 18)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <SectionHeading title="Promocoes ativas" subtitle="Aceleradores de ticket medio e recorrencia." />
          <div className="mt-4 space-y-3">
            {promotions.map((promotion) => (
              <div key={promotion.id} className="rounded-2xl border border-white/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">{promotion.title}</p>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">{promotion.type}</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{promotion.description}</p>
              </div>
            ))}
            {promotions.length === 0 ? <p className="text-sm text-slate-400">Nenhuma promocao ativa no momento.</p> : null}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-emerald-500/20 bg-emerald-500/10 p-5">
        <SectionHeading title="Plano atual" subtitle="Modelo de monetizacao pronto para venda B2B." />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-3xl font-black text-white">{session?.restaurant.plan}</p>
            <p className="mt-2 text-sm text-slate-300">Canal principal: WhatsApp direto, sem taxa por pedido.</p>
          </div>
          <Link to="/admin/billing" className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950">
            Ver planos
          </Link>
        </div>
      </section>
    </div>
  );
}
