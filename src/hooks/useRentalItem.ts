import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { RentalItem } from "@/types/database";

export function useRentalItem(id: string) {
  const [item, setItem] = useState<RentalItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    supabase
      .from("rental_items")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) throw error;
        setItem(data);
      })
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [id]);

  return { item, isLoading, error };
}