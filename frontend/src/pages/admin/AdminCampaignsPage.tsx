import { useEffect, useMemo, useState } from "react";
import { fetchWhatsappTemplates } from "../../api/automations";
import { fetchAdminCategories, fetchAdminProducts } from "../../api/catalog";
import { createPromotion, deletePromotion, fetchPromotions, updatePromotion } from "../../api/promotions";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { Input } from "../../components/Input";
import { SectionHeading } from "../../components/SectionHeading";
import { useToast } from "../../hooks/useToast";
import type { Category, Product, Promotion, WhatsappTemplate } from "../../types";
import { formatCurrency, parseOptionalNumberInput } from "../../utils/currency";

const defaultPromotionForm = {
  title: "",
  description: "",
  type: "percentage",
  value: "",
  active: true,
  productId: "",
  categoryId: "",
  minimumOrderAmount: "",
  highlightLabel: "",
  startsAt: "",
  endsAt: ""
};

export function AdminCampaignsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotionForm, setPromotionForm] = useState(defaultPromotionForm);
  const [editingPromotionId, setEditingPromotionId] = useState<string | null>(null);
  const [savingPromotion, setSavingPromotion] = useState(false);
  const { showToast } = useToast();

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [templatesData, promotionsData, productsData, categoriesData] = await Promise.all([
        fetchWhatsappTemplates(),
        fetchPromotions(),
        fetchAdminProducts(),
        fetchAdminCategories()
      ]);
      setTemplates(templatesData);
      setPromotions(promotionsData);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar as campanhas.");
      setTemplates([]);
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const targetOptions = useMemo(
    () => ({
      products: products.filter((product) => product.isActive),
      categories: categories.filter((category) => category.isActive)
    }),
    [categories, products]
  );

  function handleSendCampaign(template: WhatsappTemplate) {
    showToast({
      type: "success",
      title: "Campanha simulada",
      description: `${template.name} preparada para ${template.suggestedAudience ?? 0} contatos.`
    });
  }

  function resetPromotionForm() {
    setPromotionForm(defaultPromotionForm);
    setEditingPromotionId(null);
  }

  async function handleSavePromotion() {
    if (savingPromotion) {
      return;
    }

    const parsedValue = parseOptionalNumberInput(promotionForm.value);
    const parsedMinimumOrderAmount = parseOptionalNumberInput(promotionForm.minimumOrderAmount);

    if (!promotionForm.title.trim() || parsedValue == null) {
      showToast({
        type: "error",
        title: "Dados incompletos",
        description: "Informe ao menos nome e valor da campanha."
      });
      return;
    }

    try {
      setSavingPromotion(true);
      const payload = {
        title: promotionForm.title.trim(),
        description: promotionForm.description.trim() || null,
        type: promotionForm.type,
        value: parsedValue,
        active: promotionForm.active,
        productId: promotionForm.productId || null,
        categoryId: promotionForm.categoryId || null,
        minimumOrderAmount: parsedMinimumOrderAmount,
        highlightLabel: promotionForm.highlightLabel.trim() || null,
        startsAt: promotionForm.startsAt ? new Date(promotionForm.startsAt).toISOString() : null,
        endsAt: promotionForm.endsAt ? new Date(promotionForm.endsAt).toISOString() : null
      };

      const saved = editingPromotionId
        ? await updatePromotion(editingPromotionId, payload)
        : await createPromotion(payload);

      setPromotions((current) =>
        editingPromotionId
          ? current.map((promotion) => (promotion.id === editingPromotionId ? saved : promotion))
          : [saved, ...current]
      );
      resetPromotionForm();
      showToast({
        type: "success",
        title: editingPromotionId ? "Campanha atualizada" : "Campanha criada",
        description: `${saved.title} pronta para uso no cardapio.`
      });
    } catch (requestError) {
      showToast({
        type: "error",
        title: "Falha ao salvar campanha",
        description: requestError instanceof Error ? requestError.message : "Tente novamente."
      });
    } finally {
      setSavingPromotion(false);
    }
  }

  function handleEditPromotion(promotion: Promotion) {
    setEditingPromotionId(promotion.id);
    setPromotionForm({
      title: promotion.title,
      description: promotion.description ?? "",
      type: promotion.type,
      value: String(promotion.value),
      active: promotion.active,
      productId: promotion.productId ?? "",
      categoryId: promotion.categoryId ?? "",
      minimumOrderAmount: promotion.minimumOrderAmount == null ? "" : String(promotion.minimumOrderAmount),
      highlightLabel: promotion.highlightLabel ?? "",
      startsAt: promotion.startsAt ? promotion.startsAt.slice(0, 16) : "",
      endsAt: promotion.endsAt ? promotion.endsAt.slice(0, 16) : ""
    });
  }

  async function handleDeletePromotion(promotionId: string) {
    try {
      await deletePromotion(promotionId);
      setPromotions((current) => current.filter((promotion) => promotion.id !== promotionId));
      showToast({
        type: "success",
        title: "Campanha removida",
        description: "A campanha foi desativada sem quebrar o historico."
      });
      if (editingPromotionId === promotionId) {
        resetPromotionForm();
      }
    } catch (requestError) {
      showToast({
        type: "error",
        title: "Falha ao remover campanha",
        description: requestError instanceof Error ? requestError.message : "Tente novamente."
      });
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeading title="Campanhas" subtitle="Promocoes opcionais e mensagens prontas sem quebrar o fluxo atual." />

      {error ? (
        <EmptyState
          title="Campanhas indisponiveis"
          description={error}
          actionLabel="Recarregar campanhas"
          onAction={() => void loadData()}
          tone="error"
        />
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
          <h3 className="text-lg font-bold text-white">{editingPromotionId ? "Editar campanha" : "Nova campanha"}</h3>
          <Input
            placeholder="Nome da campanha"
            value={promotionForm.title}
            onChange={(event) => setPromotionForm((current) => ({ ...current, title: event.target.value }))}
          />
          <Input
            placeholder="Descricao"
            value={promotionForm.description}
            onChange={(event) => setPromotionForm((current) => ({ ...current, description: event.target.value }))}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <select
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              value={promotionForm.type}
              onChange={(event) => setPromotionForm((current) => ({ ...current, type: event.target.value }))}
            >
              <option value="percentage">Percentual</option>
              <option value="fixed">Valor fixo</option>
              <option value="fixed_price">Preco promocional</option>
              <option value="highlight">Destaque</option>
              <option value="combo">Combo</option>
            </select>
            <Input
              placeholder="Valor"
              value={promotionForm.value}
              onChange={(event) => setPromotionForm((current) => ({ ...current, value: event.target.value }))}
            />
            <select
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              value={promotionForm.productId}
              onChange={(event) =>
                setPromotionForm((current) => ({
                  ...current,
                  productId: event.target.value,
                  categoryId: event.target.value ? "" : current.categoryId
                }))
              }
            >
              <option value="">Produto alvo (opcional)</option>
              {targetOptions.products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              value={promotionForm.categoryId}
              onChange={(event) =>
                setPromotionForm((current) => ({
                  ...current,
                  categoryId: event.target.value,
                  productId: event.target.value ? "" : current.productId
                }))
              }
            >
              <option value="">Categoria alvo (opcional)</option>
              {targetOptions.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <Input
              placeholder="Pedido minimo"
              value={promotionForm.minimumOrderAmount}
              onChange={(event) =>
                setPromotionForm((current) => ({ ...current, minimumOrderAmount: event.target.value }))
              }
            />
            <Input
              placeholder="Badge / destaque visual"
              value={promotionForm.highlightLabel}
              onChange={(event) => setPromotionForm((current) => ({ ...current, highlightLabel: event.target.value }))}
            />
            <Input
              type="datetime-local"
              value={promotionForm.startsAt}
              onChange={(event) => setPromotionForm((current) => ({ ...current, startsAt: event.target.value }))}
            />
            <Input
              type="datetime-local"
              value={promotionForm.endsAt}
              onChange={(event) => setPromotionForm((current) => ({ ...current, endsAt: event.target.value }))}
            />
          </div>
          <label className="flex items-center gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={promotionForm.active}
              onChange={(event) => setPromotionForm((current) => ({ ...current, active: event.target.checked }))}
            />
            Campanha ativa
          </label>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void handleSavePromotion()} disabled={savingPromotion}>
              {savingPromotion ? "Salvando..." : editingPromotionId ? "Salvar alteracoes" : "Criar campanha"}
            </Button>
            {editingPromotionId ? (
              <Button className="bg-white/10 shadow-none" onClick={resetPromotionForm}>
                Cancelar
              </Button>
            ) : null}
          </div>
        </div>

        <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
          <h3 className="text-lg font-bold text-white">Campanhas ativas e historico</h3>
          {!loading && promotions.length === 0 ? (
            <EmptyState
              title="Nenhuma campanha cadastrada"
              description="Crie uma promocao para destacar produto, categoria ou preco especial."
            />
          ) : null}
          <div className="space-y-3">
            {promotions.map((promotion) => (
              <article key={promotion.id} className="rounded-2xl border border-white/10 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-white">{promotion.title}</h4>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-slate-300">
                        {promotion.active ? "ativa" : "inativa"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">
                      {promotion.productName || promotion.categoryName || "Aplicacao geral"}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      {promotion.type} · valor {promotion.type === "percentage" ? `${promotion.value}%` : formatCurrency(promotion.value)}
                    </p>
                    {promotion.minimumOrderAmount ? (
                      <p className="text-xs text-slate-400">
                        Pedido minimo: {formatCurrency(promotion.minimumOrderAmount)}
                      </p>
                    ) : null}
                    {promotion.promotionalPrice != null ? (
                      <p className="text-sm text-emerald-300">Preco calculado: {formatCurrency(promotion.promotionalPrice)}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Button className="bg-white/10 px-3 py-2 text-xs shadow-none" onClick={() => handleEditPromotion(promotion)}>
                      Editar
                    </Button>
                    <Button
                      className="bg-red-500/20 px-3 py-2 text-xs text-red-100 shadow-none"
                      onClick={() => void handleDeletePromotion(promotion.id)}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {!loading && templates.length === 0 ? (
          <div className="md:col-span-2">
            <EmptyState
              title="Nenhuma campanha pronta"
              description="Quando o motor de automacao estiver ativo, os templates aparecerao aqui."
            />
          </div>
        ) : null}

        {templates.map((template) => (
          <article key={template.id} className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">{template.category}</p>
                <h3 className="mt-2 text-xl font-bold text-white">{template.name}</h3>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                {template.suggestedAudience ?? 0} contatos
              </span>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-300">{template.content}</p>

            <Button className="mt-6 bg-emerald-500 text-slate-950 shadow-none" onClick={() => handleSendCampaign(template)}>
              {template.actionLabel ?? "Enviar campanha"}
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
