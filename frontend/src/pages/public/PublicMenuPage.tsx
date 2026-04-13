import { motion } from "framer-motion";
import { ArrowRight, Clock3, Flame, Sparkles, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { trackEvent } from "../../api/analytics";
import { CartDrawer } from "../../components/CartDrawer";
import { CategoryTabs } from "../../components/CategoryTabs";
import { FloatingCartButton } from "../../components/FloatingCartButton";
import { ProductCard } from "../../components/ProductCard";
import { SectionHeading } from "../../components/SectionHeading";
import { SkeletonCard } from "../../components/SkeletonCard";
import { useCart } from "../../hooks/useCart";
import { useMenuData } from "../../hooks/useMenuData";
import type { Product } from "../../types";

export function PublicMenuPage() {
  const { restaurantSlug = "rlburger" } = useParams();
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const { addItem, count, total } = useCart();
  const { restaurant, loading, error, activeCategory, setActiveCategory, activeProducts, featuredProducts } =
    useMenuData(restaurantSlug);

  useEffect(() => {
    trackEvent({
      restaurantSlug,
      type: "page_view"
    }).catch(() => undefined);
  }, [restaurantSlug]);

  function handleAddProduct(product: Product) {
    addItem(product);
    trackEvent({
      restaurantSlug,
      type: "add_to_cart",
      payload: {
        productId: product.id,
        name: product.name
      }
    }).catch(() => undefined);
  }

  function handleAddSuggested(productId: string) {
    const product = restaurant?.categories
      ?.flatMap((category) => category.products || [])
      .find((entry) => entry.id === productId);

    if (product) {
      addItem(product);
    }
  }

  return (
    <div className="min-h-screen bg-hero-pattern text-white">
      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8 lg:py-8">
        <section className="grid gap-6 lg:grid-cols-[1.45fr_0.8fr]">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-5 backdrop-blur sm:p-6"
            >
              {restaurant?.settings?.bannerUrl ? (
                <img src={restaurant.settings.bannerUrl} alt={restaurant.name} className="mb-5 h-40 w-full rounded-[24px] object-cover" />
              ) : null}
              <div className="flex flex-wrap items-center gap-4">
                {restaurant?.logoUrl ? (
                  <img src={restaurant.logoUrl} alt={restaurant.name} className="h-16 w-16 rounded-2xl object-cover" />
                ) : null}
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                    <Sparkles size={14} />
                    Cardapio inteligente com IA
                  </div>
                  <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
                    {restaurant?.settings?.heroTitle || "Peça direto no WhatsApp, sem taxa de marketplace"}
                  </h1>
                  <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
                    {restaurant?.settings?.heroSubtitle ||
                      restaurant?.description ||
                      "Monte seu pedido com combos e upsells inteligentes."}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  <Store size={14} />
                  Direto com a loja
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">PWA ready</div>
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  IA ativa: {restaurant?.isAiUpsellOn ? "sim" : "nao"}
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  <Clock3 size={14} />
                  {restaurant?.settings?.estimatedTimeMin || 30}-{restaurant?.settings?.estimatedTimeMax || 45} min
                </div>
              </div>
            </motion.div>

            {featuredProducts.length > 0 ? (
              <section className="space-y-4">
                <SectionHeading title="Mais pedidos" subtitle="Produtos destacados para aumentar conversao e acelerar a escolha." />
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {featuredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleAddProduct(product)}
                      className="min-w-72 rounded-[28px] border border-emerald-400/15 bg-gradient-to-br from-emerald-400/12 to-white/5 p-4 text-left"
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                        <Flame size={16} />
                        Destaque
                      </div>
                      <h3 className="mt-3 text-lg font-bold text-white">{product.name}</h3>
                      <p className="mt-2 text-sm text-slate-300">{product.description}</p>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="space-y-5">
              <SectionHeading title="Categorias" subtitle="Navegacao mobile-first, rapida e objetiva." />
              {restaurant?.categories ? (
                <CategoryTabs
                  categories={restaurant.categories}
                  active={activeCategory}
                  onChange={setActiveCategory}
                />
              ) : null}
            </section>

            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <SectionHeading
                  title="Produtos"
                  subtitle="Cards inspirados em apps de delivery, com foco em conversao."
                />
                <a href="/admin/login" className="inline-flex items-center gap-2 text-sm text-brand">
                  Painel do restaurante
                  <ArrowRight size={16} />
                </a>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {loading
                  ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)
                  : error
                    ? (
                        <div className="col-span-full rounded-[24px] border border-red-400/20 bg-red-500/10 p-5 text-sm text-red-100">
                          {error}
                        </div>
                      )
                  : activeProducts.map((product) => (
                      <ProductCard key={product.id} product={product} onAdd={handleAddProduct} />
                    ))}
              </div>
            </section>
          </div>

          <div className="hidden lg:sticky lg:top-6 lg:block lg:self-start">
            <CartDrawer
              restaurantSlug={restaurantSlug}
              upsellEnabled={restaurant?.isAiUpsellOn || false}
              onAddSuggested={handleAddSuggested}
            />
          </div>
        </section>
      </div>

      <FloatingCartButton visible={count > 0} count={count} total={total} onClick={() => setMobileCartOpen(true)} />

      <div className={mobileCartOpen ? "fixed inset-0 z-40 bg-slate-950/70 p-4 backdrop-blur lg:hidden" : "hidden"}>
        <div className="absolute inset-x-4 bottom-4 top-20 overflow-y-auto">
          <CartDrawer
            restaurantSlug={restaurantSlug}
            upsellEnabled={restaurant?.isAiUpsellOn || false}
            onAddSuggested={handleAddSuggested}
            isOpen={mobileCartOpen}
            onClose={() => setMobileCartOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}
