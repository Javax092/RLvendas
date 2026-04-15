import { useEffect, useState } from "react";
import { fetchSettings, updateSettings } from "../../api/settings";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { Input } from "../../components/Input";
import { SectionHeading } from "../../components/SectionHeading";
import { useToast } from "../../hooks/useToast";
import type { RestaurantAdminSettings } from "../../types";
import { toMoneyNumber } from "../../shared/lib/currency";

export function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<RestaurantAdminSettings>({
    restaurant: {
      name: "",
      slug: "",
      phone: "",
      currency: "BRL",
      timezone: "America/Manaus",
      deliveryFee: 0,
      businessHours: "Seg-Dom 11:00 as 23:00"
    },
    notifications: {
      email: true,
      whatsapp: true
    },
    preferences: {
      autoAcceptOrders: false,
      showOutOfStock: false
    },
    branding: {
      primaryColor: "#f97316",
      secondaryColor: "#111827",
      logoUrl: "",
      bannerUrl: "",
      heroTitle: "",
      heroSubtitle: "",
      seoTitle: "",
      seoDescription: ""
    }
  });
  const { showToast } = useToast();

  async function loadSettings() {
    setLoading(true);
    setError("");
    try {
      setForm(await fetchSettings());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar as configuracoes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  async function handleSave() {
    try {
      const saved = await updateSettings(form);
      setForm(saved);
      showToast({
        type: "success",
        title: "Identidade atualizada",
        description: "As configuracoes do restaurante foram salvas."
      });
    } catch (requestError) {
      showToast({
        type: "error",
        title: "Falha ao salvar",
        description: requestError instanceof Error ? requestError.message : "Tente novamente."
      });
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeading title="Configuracoes" subtitle="WhatsApp, SEO, cores e IA do restaurante." />
      {error ? (
        <EmptyState
          title="Configuracoes indisponiveis"
          description={error}
          actionLabel="Recarregar configuracoes"
          onAction={() => void loadSettings()}
          tone="error"
        />
      ) : null}
      <div className="grid gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 md:grid-cols-2">
        <Input
          placeholder="WhatsApp"
          value={form.restaurant.phone}
          onChange={(event) =>
            setForm((current) => ({ ...current, restaurant: { ...current.restaurant, phone: event.target.value } }))
          }
          disabled={loading}
        />
        <Input
          placeholder="Nome do restaurante"
          value={form.restaurant.name}
          onChange={(event) =>
            setForm((current) => ({ ...current, restaurant: { ...current.restaurant, name: event.target.value } }))
          }
          disabled={loading}
        />
        <Input
          placeholder="Taxa de entrega"
          value={String(form.restaurant.deliveryFee ?? 0)}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              restaurant: { ...current.restaurant, deliveryFee: toMoneyNumber(event.target.value) }
            }))
          }
          disabled={loading}
        />
        <Input
          placeholder="Horario de funcionamento"
          value={form.restaurant.businessHours ?? ""}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              restaurant: { ...current.restaurant, businessHours: event.target.value }
            }))
          }
          disabled={loading}
        />
        <Input
          placeholder="Hero title"
          value={form.branding.heroTitle}
          onChange={(event) =>
            setForm((current) => ({ ...current, branding: { ...current.branding, heroTitle: event.target.value } }))
          }
          disabled={loading}
        />
        <Input
          placeholder="Logo URL"
          value={form.branding.logoUrl}
          onChange={(event) =>
            setForm((current) => ({ ...current, branding: { ...current.branding, logoUrl: event.target.value } }))
          }
          disabled={loading}
        />
        <Input
          placeholder="Banner URL"
          value={form.branding.bannerUrl}
          onChange={(event) =>
            setForm((current) => ({ ...current, branding: { ...current.branding, bannerUrl: event.target.value } }))
          }
          disabled={loading}
        />
        <Input
          placeholder="Cor primaria"
          value={form.branding.primaryColor}
          onChange={(event) =>
            setForm((current) => ({ ...current, branding: { ...current.branding, primaryColor: event.target.value } }))
          }
          disabled={loading}
        />
        <Input
          placeholder="Cor secundaria"
          value={form.branding.secondaryColor}
          onChange={(event) =>
            setForm((current) => ({ ...current, branding: { ...current.branding, secondaryColor: event.target.value } }))
          }
          disabled={loading}
        />
        <Input
          placeholder="Hero subtitle"
          value={form.branding.heroSubtitle}
          onChange={(event) =>
            setForm((current) => ({ ...current, branding: { ...current.branding, heroSubtitle: event.target.value } }))
          }
          disabled={loading}
        />
        <Input
          placeholder="SEO title"
          value={form.branding.seoTitle}
          onChange={(event) =>
            setForm((current) => ({ ...current, branding: { ...current.branding, seoTitle: event.target.value } }))
          }
          disabled={loading}
        />
        <Input
          placeholder="SEO description"
          value={form.branding.seoDescription}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              branding: { ...current.branding, seoDescription: event.target.value }
            }))
          }
          disabled={loading}
        />
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3">
          <input
            type="checkbox"
            checked={form.notifications.whatsapp}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                notifications: { ...current.notifications, whatsapp: event.target.checked }
              }))
            }
          />
          <span className="text-sm text-slate-300">Notificacoes por WhatsApp</span>
        </div>
        <div className="rounded-[24px] border border-white/10 p-4">
          <p className="text-sm text-slate-400">Preview visual</p>
          <div
            className="mt-3 rounded-[20px] p-5"
            style={{
              background: `linear-gradient(135deg, ${form.branding.secondaryColor}, ${form.branding.primaryColor})`
            }}
          >
            <p className="text-xl font-black text-white">{form.branding.heroTitle || "Seu restaurante"}</p>
            <p className="mt-2 text-sm text-slate-200">
              {form.branding.heroSubtitle || "Seu cardapio com identidade propria"}
            </p>
          </div>
        </div>
        <Button onClick={handleSave}>Salvar configuracoes</Button>
      </div>
    </div>
  );
}
