import { memo } from "react";
import { Clock3, Plus, Sparkles, Star } from "lucide-react";
import { Button } from "./Button";
import type { Product } from "../types";
import { formatCurrency } from "../utils/currency";

function ProductCardComponent({
  product,
  onAdd
}: {
  product: Product;
  onAdd: (product: Product) => void;
}) {
  const showBestSeller = product.isFeatured || product.tags.includes("best-seller");
  const showRecommended = product.tags.includes("premium") || product.tags.includes("combo");
  const displayPrice = product.promotionalPrice ?? product.price;
  const promotionLabel = product.promotion?.highlightLabel || product.promotion?.title;

  return (
    <article className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 backdrop-blur transition duration-200 hover:-translate-y-1 hover:border-emerald-400/30">
      <img
        src={product.imageUrl || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80"}
        alt={product.name}
        className="h-44 w-full object-cover"
        loading="lazy"
        decoding="async"
      />
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          {showBestSeller ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-semibold text-amber-200">
              <Sparkles size={12} />
              🔥 Mais pedido
            </span>
          ) : null}
          {showRecommended ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-semibold text-emerald-200">
              <Star size={12} />
              ⭐ Recomendado
            </span>
          ) : null}
          {product.promotion?.active ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-400/15 px-3 py-1 text-[11px] font-semibold text-rose-200">
              <Sparkles size={12} />
              {promotionLabel || "Promocao"}
            </span>
          ) : null}
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-white">{product.name}</h3>
          <p className="line-clamp-2 text-sm text-slate-400">{product.description}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock3 size={14} />
          25-40 min
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-brand">{formatCurrency(displayPrice)}</span>
            {product.promotionalPrice && product.promotionalPrice < product.price ? (
              <span className="text-xs text-slate-500 line-through">{formatCurrency(product.price)}</span>
            ) : null}
            {!product.promotionalPrice && product.compareAtPrice ? (
              <span className="text-xs text-slate-500 line-through">{formatCurrency(product.compareAtPrice)}</span>
            ) : null}
          </div>
          <Button className="gap-2 px-3 py-2 text-xs" onClick={() => onAdd(product)}>
            <Plus size={16} />
            Adicionar
          </Button>
        </div>
      </div>
    </article>
  );
}

export const ProductCard = memo(ProductCardComponent);
