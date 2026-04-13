import { motion } from "framer-motion";

export function MetricCard({
  label,
  value,
  helper
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[28px] border border-white/10 bg-white/5 p-5"
    >
      <p className="text-sm text-slate-400">{label}</p>
      <h3 className="mt-2 text-3xl font-black text-white">{value}</h3>
      <p className="mt-3 text-sm text-slate-500">{helper}</p>
    </motion.article>
  );
}

