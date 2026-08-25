import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { ItemCategory, RentalItem } from "@/types/database";

export function useRentalItems(category?: ItemCategory) {
  const [items, setItems] = useState<RentalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // The query builder is a thenable, not a real Promise, so it has no
    // .catch()/.finally() — await it instead.
    const fetchItems = async () => {
      setIsLoading(true);
      let query = supabase.from("rental_items").select("*").order("name");
      if (category) {
        query = query.eq("category", category);
      }
      const { data, error } = await query;
      if (error) {
        setError(new Error(error.message));
      } else {
        setItems(data ?? []);
      }
      setIsLoading(false);
    };

    fetchItems();
  }, [category]);

  return { items, isLoading, error };
}