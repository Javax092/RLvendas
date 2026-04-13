import { cn } from "../utils/cn";
import type { Category } from "../types";

export function CategoryTabs({
  categories,
  active,
  onChange
}: {
  categories: Category[];
  active?: string;
  onChange: (slug: string) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onChange(category.slug)}
          className={cn(
            "whitespace-nowrap rounded-full border px-4 py-2 text-sm transition",
            active === category.slug
              ? "border-brand bg-brand text-white"
              : "border-white/10 bg-white/5 text-slate-300 hover:border-brand/50"
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}

