import type { ReactNode } from "react";
import { Button } from "./Button";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  tone = "default",
  children
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: "default" | "error";
  children?: ReactNode;
}) {
  return (
    <div
      className={
        tone === "error"
          ? "rounded-[28px] border border-red-500/30 bg-red-500/10 p-5"
          : "rounded-[28px] border border-dashed border-white/10 bg-white/5 p-5"
      }
    >
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
      {actionLabel && onAction ? (
        <Button className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
