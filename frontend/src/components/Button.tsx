import type { ButtonHTMLAttributes } from "react";
import { cn } from "../utils/cn";

export function Button({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200",
        "bg-brand text-white shadow-glow hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}

