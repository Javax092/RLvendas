import { useEffect, useMemo, useState } from "react";
import { fetchPublicMenu } from "../api/catalog";
import type { Product, Restaurant } from "../types";

export function useMenuData(restaurantSlug: string) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>();

  useEffect(() => {
    setLoading(true);
    fetchPublicMenu(restaurantSlug)
      .then((data) => {
        setRestaurant(data);
        setActiveCategory((current) => current || data.categories?.[0]?.slug);
      })
      .finally(() => setLoading(false));
  }, [restaurantSlug]);

  const activeProducts = useMemo(() => {
    if (!restaurant?.categories || !activeCategory) {
      return [] as Product[];
    }

    return restaurant.categories.find((category) => category.slug === activeCategory)?.products || [];
  }, [restaurant, activeCategory]);

  const featuredProducts = useMemo(
    () =>
      restaurant?.categories
        ?.flatMap((category) => category.products || [])
        .filter((product) => product.isFeatured)
        .slice(0, 4) || [],
    [restaurant]
  );

  return {
    restaurant,
    loading,
    activeCategory,
    setActiveCategory,
    activeProducts,
    featuredProducts
  };
}

