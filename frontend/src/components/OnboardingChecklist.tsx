import { CheckCircle2, Circle } from "lucide-react";
import { motion } from "framer-motion";
import type { OnboardingStatus } from "../types";

export function OnboardingChecklist({
  data,
  onPrimaryAction
}: {
  data: OnboardingStatus;
  onPrimaryAction: () => void;
}) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-emerald-500/15 via-slate-950 to-slate-900 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-400">Onboarding inteligente</p>
          <h2 className="mt-2 text-2xl font-black text-white">Seu setup pode ficar pronto em {data.estimatedSetupMinutes} min</h2>
          <p className="mt-2 text-sm text-slate-300">Fluxo desenhado para gerar valor nas primeiras 24 horas.</p>
        </div>
        <button
          onClick={onPrimaryAction}
          className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
        >
          Continuar setup
        </button>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${data.progress}%` }}
          className="h-full rounded-full bg-emerald-500"
        />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {data.checklist.map((item) => (
          <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-start gap-3">
              <div className={item.completed ? "text-emerald-400" : "text-slate-500"}>
                {item.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
              </div>
              <div>
                <p className="font-semibold text-white">{item.label}</p>
                <p className="mt-1 text-sm text-slate-400">{item.helper}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

