import type { InputHTMLAttributes } from "react";
import { cn } from "../utils/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition",
        "placeholder:text-slate-500 focus:border-brand focus:ring-2 focus:ring-brand/30",
        className
      )}
      {...props}
    />
  );
}

