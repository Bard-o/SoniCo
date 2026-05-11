import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Rental, RentalStatus } from "@/types/database";

interface RentalDetailItem {
  id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  item: { name: string } | null;
}

interface RentalDetail extends Rental {
  items: RentalDetailItem[];
}

export function useRental(id: string | null) {
  const [rental, setRental] = useState<RentalDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    if (!id) {
      setRental(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: err } = await supabase
        .from("rentals")
        .select(`
          *,
          items:rental_items(id, item_id, quantity, unit_price, item:items(name))
        `)
        .eq("id", id)
        .single();

      if (err) {
        setError(err.message);
      } else {
        setRental(data as unknown as RentalDetail);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [id]);

  return { rental, isLoading, error, refetch: fetch };
}