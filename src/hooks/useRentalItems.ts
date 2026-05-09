import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { RentalItem } from "@/types/database";

export function useRentalItems(category?: string) {
  const [items, setItems] = useState<RentalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let query = supabase.from("rental_items").select("*").order("name");
    if (category) {
      query = query.eq("category", category);
    }
    query
      .then(({ data, error }) => {
        if (error) throw error;
        setItems(data ?? []);
      })
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [category]);

  return { items, isLoading, error };
}