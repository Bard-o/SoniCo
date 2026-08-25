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

    // The query builder is a thenable, not a real Promise, so it has no
    // .catch()/.finally() — await it instead.
    const fetchItem = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("rental_items")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        setError(new Error(error.message));
      } else {
        setItem(data);
      }
      setIsLoading(false);
    };

    fetchItem();
  }, [id]);

  return { item, isLoading, error };
}