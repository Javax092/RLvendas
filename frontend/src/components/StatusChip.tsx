const orderStatusMap: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "Pendente",
    className: "bg-amber-500/15 text-amber-300 border-amber-500/30"
  },
  PREPARING: {
    label: "Preparando",
    className: "bg-sky-500/15 text-sky-300 border-sky-500/30"
  },
  READY: {
    label: "Pronto",
    className: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
  },
  DELIVERED: {
    label: "Entregue",
    className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
  },
  CANCELLED: {
    label: "Cancelado",
    className: "bg-red-500/15 text-red-300 border-red-500/30"
  }
};

export function StatusChip({ status }: { status: string }) {
  const config = orderStatusMap[status] ?? {
    label: status,
    className: "bg-white/10 text-slate-200 border-white/10"
  };

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}
