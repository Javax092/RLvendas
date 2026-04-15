import { useEffect, useMemo, useState } from "react";
import { fetchPublicMenu } from "../api/catalog";
import { normalizeApiError } from "../api/helpers";
import type { Product, Restaurant } from "../types";

export function useMenuData(restaurantSlug: string) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [activeCategory, setActiveCategory] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(undefined);
    fetchPublicMenu(restaurantSlug)
      .then((data) => {
        if (cancelled) {
          return;
        }

        setRestaurant(data);
        setActiveCategory((current) => {
          const availableSlugs = new Set((data.categories ?? []).map((category) => category.slug));

          if (current && availableSlugs.has(current)) {
            return current;
          }

          return data.categories?.[0]?.slug;
        });
      })
      .catch((reason) => {
        if (cancelled) {
          return;
        }

        setRestaurant(null);
        setError(normalizeApiError(reason).message);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
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
    error,
    activeCategory,
    setActiveCategory,
    activeProducts,
    featuredProducts
  };
}
