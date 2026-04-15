import type { ChangeEvent } from "react";
import { FileUp, Sparkles } from "lucide-react";
import { useState } from "react";
import { importMenuFromFile, importMenuFromText, previewMenuImport } from "../api/menuImport";
import { useToast } from "../hooks/useToast";
import { formatCurrency } from "../utils/currency";
import { Button } from "./Button";
import { Input } from "./Input";

export function MenuImportCard({ onImported }: { onImported: () => void }) {
  const [rawText, setRawText] = useState("X-Tudo - 20\nX-Bacon - 18\nBatata - 10\nCoca-Cola - 6");
  const [preview, setPreview] = useState<Array<{ name: string; price: number; categoryName: string }>>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function handlePreview() {
    setLoading(true);
    try {
      const data = await previewMenuImport(rawText);
      setPreview(data.items || []);
      showToast({
        type: "info",
        title: "Preview gerado",
        description: `${data.count} itens identificados automaticamente`
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    setLoading(true);
    try {
      const data = await importMenuFromText(rawText);
      showToast({
        type: "success",
        title: "Cardapio importado",
        description: `${data.createdCount} produtos criados ou atualizados`
      });
      onImported();
    } finally {
      setLoading(false);
    }
  }

  async function handleFileImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setLoading(true);
    try {
      const data = await importMenuFromFile(file);
      setRawText(data.rawText || "");
      setPreview(data.items || []);
      showToast({
        type: "info",
        title: "Arquivo lido",
        description: `${data.count} itens encontrados em ${data.fileName}`
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
            <Sparkles size={16} />
            Importacao automatica
          </div>
          <h3 className="mt-2 text-xl font-bold text-white">Cole texto ou envie PDF para criar o cardapio</h3>
          <p className="mt-2 text-sm text-slate-400">Versao heuristica com parsing automatico para acelerar o setup.</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white">
          <FileUp size={16} />
          Enviar arquivo
          <input type="file" className="hidden" accept=".pdf,.txt" onChange={handleFileImport} />
        </label>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-3">
          <textarea
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            className="min-h-48 w-full rounded-[24px] border border-white/10 bg-slate-950/70 p-4 text-sm text-white outline-none"
          />
          <div className="flex flex-wrap gap-3">
            <Button onClick={handlePreview} disabled={loading}>
              Analisar cardapio
            </Button>
            <Button className="bg-emerald-500 text-slate-950 shadow-none" onClick={handleImport} disabled={loading}>
              Importar itens
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <Input value={`${preview.length} itens detectados`} readOnly />
          <div className="space-y-3">
            {preview.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
                O preview aparece aqui com categorias e precos detectados.
              </div>
            ) : (
              preview.map((item) => (
                <div key={`${item.name}-${item.price}`} className="rounded-2xl border border-white/10 p-3">
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="text-sm text-slate-400">{item.categoryName}</p>
                  <p className="mt-2 text-sm text-emerald-400">{formatCurrency(item.price)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
