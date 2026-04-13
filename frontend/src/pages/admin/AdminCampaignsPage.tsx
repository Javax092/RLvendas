import { useEffect, useState } from "react";
import { fetchWhatsappTemplates } from "../../api/automations";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { SectionHeading } from "../../components/SectionHeading";
import { useToast } from "../../hooks/useToast";
import type { WhatsappTemplate } from "../../types";

export function AdminCampaignsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([]);
  const { showToast } = useToast();

  async function loadTemplates() {
    setLoading(true);
    setError("");
    try {
      setTemplates(await fetchWhatsappTemplates());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar as campanhas.");
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTemplates();
  }, []);

  function handleSendCampaign(template: WhatsappTemplate) {
    showToast({
      type: "success",
      title: "Campanha simulada",
      description: `${template.name} preparada para ${template.suggestedAudience ?? 0} contatos.`
    });
  }

  return (
    <div className="space-y-6">
      <SectionHeading title="Campanhas" subtitle="Mensagens prontas para boas-vindas, reativacao e upsell." />

      {error ? (
        <EmptyState
          title="Campanhas indisponiveis"
          description={error}
          actionLabel="Recarregar campanhas"
          onAction={() => void loadTemplates()}
          tone="error"
        />
      ) : null}

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
