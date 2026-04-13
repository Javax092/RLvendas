import { Plus } from "lucide-react";
import { Button } from "./Button";
import type { Product } from "../types";
import { formatCurrency } from "../utils/currency";

export function ProductCard({
  product,
  onAdd
}: {
  product: Product;
  onAdd: (product: Product) => void;
}) {
  return (
    <article className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 backdrop-blur">
      <img
        src={product.imageUrl || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80"}
        alt={product.name}
        className="h-44 w-full object-cover"
      />
      <div className="space-y-4 p-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-white">{product.name}</h3>
          <p className="line-clamp-2 text-sm text-slate-400">{product.description}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-brand">{formatCurrency(product.price)}</span>
          <Button className="gap-2 px-3 py-2 text-xs" onClick={() => onAdd(product)}>
            <Plus size={16} />
            Adicionar
          </Button>
        </div>
      </div>
    </article>
  );
}

