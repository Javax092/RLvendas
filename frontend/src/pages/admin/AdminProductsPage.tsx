import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createCategory, createProduct, fetchAdminCategories, fetchAdminProducts } from "../../api/catalog";
import { fetchStockAlerts } from "../../api/stock";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { Input } from "../../components/Input";
import { MenuImportCard } from "../../components/MenuImportCard";
import { SectionHeading } from "../../components/SectionHeading";
import { SkeletonCard } from "../../components/SkeletonCard";
import { useToast } from "../../hooks/useToast";
import type { Category, Product, StockAlertsResponse } from "../../types";
import { formatCurrency } from "../../utils/currency";

export function AdminProductsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlertsResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [categoryName, setCategoryName] = useState("");
  const [productForm, setProductForm] = useState({
    categoryId: "",
    name: "",
    description: "",
    imageUrl: "",
    price: "",
    costPrice: "",
    stockQuantity: "20"
  });
  const { showToast } = useToast();

  async function loadCatalog() {
    setLoading(true);
    setError("");
    const [categoriesResult, productsResult, stockResult] = await Promise.allSettled([
      fetchAdminCategories(),
      fetchAdminProducts(),
      fetchStockAlerts()
    ]);

    if (categoriesResult.status === "fulfilled") {
      setCategories(categoriesResult.value);
      setProductForm((current) => ({
        ...current,
        categoryId: current.categoryId || categoriesResult.value[0]?.id || ""
      }));
    } else {
      setCategories([]);
    }

    if (productsResult.status === "fulfilled") {
      setProducts(productsResult.value);
    } else {
      setProducts([]);
      setError(productsResult.reason?.message ?? "Nao foi possivel carregar o catalogo.");
    }

    if (stockResult.status === "fulfilled") {
      setStockAlerts(stockResult.value);
    } else {
      setStockAlerts(null);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadCatalog();
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim().toLowerCase());
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  async function handleCreateCategory() {
    if (!categoryName) {
      return;
    }

    try {
      const category = await createCategory({
        name: categoryName,
        sortOrder: categories.length + 1,
        isActive: true
      });

      setCategories((current) => [...current, category]);
      setCategoryName("");
      showToast({
        type: "success",
        title: "Categoria criada",
        description: `${category.name} pronta para organizar o cardapio`
      });
    } catch (requestError) {
      showToast({
        type: "error",
        title: "Falha ao criar categoria",
        description: requestError instanceof Error ? requestError.message : "Tente novamente."
      });
    }
  }

  async function handleCreateProduct() {
    if (!productForm.categoryId || !productForm.name || !productForm.description || !productForm.price) {
      return;
    }

    try {
      const product = await createProduct({
        ...productForm,
        price: Number(productForm.price),
        costPrice: Number(productForm.costPrice || 0),
        stockQuantity: Number(productForm.stockQuantity || 0),
        tags: []
      });

      setProducts((current) => [product, ...current]);
      setProductForm((current) => ({
        ...current,
        name: "",
        description: "",
        imageUrl: "",
        price: "",
        costPrice: "",
        stockQuantity: "20"
      }));
      showToast({
        type: "success",
        title: "Produto publicado",
        description: `${product.name} ja pode aparecer no cardapio`
      });
    } catch (requestError) {
      showToast({
        type: "error",
        title: "Falha ao criar produto",
        description: requestError instanceof Error ? requestError.message : "Tente novamente."
      });
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = selectedCategoryId === "all" ? true : product.categoryId === selectedCategoryId;
      const haystack = `${product.name} ${product.description} ${product.category?.name ?? ""}`.toLowerCase();
      const matchesSearch = debouncedSearchTerm ? haystack.includes(debouncedSearchTerm) : true;
      return matchesCategory && matchesSearch;
    });
  }, [debouncedSearchTerm, products, selectedCategoryId]);

  return (
    <div className="space-y-6">
      <SectionHeading title="Catalogo" subtitle="CRUD inicial de categorias e produtos do restaurante." />
      <MenuImportCard onImported={loadCatalog} />

      {error ? (
        <EmptyState
          title="Catalogo indisponivel"
          description={error}
          actionLabel="Recarregar catalogo"
          onAction={() => void loadCatalog()}
          tone="error"
        />
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
          <h3 className="text-lg font-bold text-white">Nova categoria</h3>
          <Input placeholder="Ex.: Sobremesas" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
          <Button onClick={handleCreateCategory}>Criar categoria</Button>

          <div className="space-y-3 pt-4">
            {categories.map((category) => (
              <div key={category.id} className="rounded-2xl border border-white/10 p-3">
                <div className="font-medium text-white">{category.name}</div>
                <div className="text-sm text-slate-400">{category.slug}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-white">Produtos</h3>
            <Button className="bg-emerald-500 text-slate-950 shadow-none" onClick={handleCreateProduct}>
              Novo produto
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <Input
                className="pl-10"
                placeholder="Buscar por nome, descricao ou categoria"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <select
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              value={selectedCategoryId}
              onChange={(event) => setSelectedCategoryId(event.target.value)}
            >
              <option value="all">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <select
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
              value={productForm.categoryId}
              onChange={(event) => setProductForm((current) => ({ ...current, categoryId: event.target.value }))}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <Input
              placeholder="Nome"
              value={productForm.name}
              onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
            />
            <Input
              placeholder="Descricao"
              value={productForm.description}
              onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))}
            />
            <Input
              placeholder="Imagem URL"
              value={productForm.imageUrl}
              onChange={(event) => setProductForm((current) => ({ ...current, imageUrl: event.target.value }))}
            />
            <Input
              placeholder="Preco"
              value={productForm.price}
              onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))}
            />
            <Input
              placeholder="Custo"
              value={productForm.costPrice}
              onChange={(event) => setProductForm((current) => ({ ...current, costPrice: event.target.value }))}
            />
            <Input
              placeholder="Estoque"
              value={productForm.stockQuantity}
              onChange={(event) => setProductForm((current) => ({ ...current, stockQuantity: event.target.value }))}
            />
          </div>
          <Button onClick={handleCreateProduct}>Salvar produto</Button>

          {stockAlerts ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
              <p className="text-sm font-semibold text-amber-300">
                Estoque monitorado: {stockAlerts.summary.totalTracked} itens
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {stockAlerts.summary.criticalStock} criticos, {stockAlerts.summary.lowStock} com estoque baixo.
              </p>
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : filteredProducts.length === 0 ? (
              <div className="md:col-span-2">
                <EmptyState
                  title="Nenhum produto encontrado"
                  description="Ajuste os filtros ou cadastre o primeiro item do catalogo."
                />
              </div>
            ) : (
              filteredProducts.map((product) => (
                <article key={product.id} className="overflow-hidden rounded-2xl border border-white/10">
                  <div className="aspect-[16/10] bg-slate-900">
                    <img
                      src={product.imageUrl || "https://placehold.co/640x400/0f172a/f8fafc?text=Produto"}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white">{product.name}</div>
                        <div className="text-sm text-slate-400">{product.category?.name || "Categoria"}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={
                            product.isActive
                              ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300"
                              : "rounded-full bg-slate-500/20 px-3 py-1 text-xs font-semibold text-slate-300"
                          }
                        >
                          {product.isActive ? "Ativo" : "Inativo"}
                        </span>
                        {(product.stockQuantity ?? 0) <= 12 ? (
                          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                            Baixo estoque
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-brand">{formatCurrency(product.price)}</div>
                        <div className="text-xs text-slate-500">
                          custo {formatCurrency(product.costPrice ?? product.price * 0.35)}
                        </div>
                      </div>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-300">
                        {product.productType}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">estoque atual: {product.stockQuantity ?? 0}</div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
