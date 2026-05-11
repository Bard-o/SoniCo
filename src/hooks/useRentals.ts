import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { RentalStatus } from "@/types/database";

export interface RentalWithItems {
  id: string;
  user_id: string;
  band_or_event_name: string | null;
  details: string | null;
  start_datetime: string;
  end_datetime: string;
  status: RentalStatus;
  total_price: number;
  owner_message: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  items?: { id: string; item_id: string; quantity: number; unit_price: number; item?: { name: string; photos: string[] } }[];
}

interface UseRentalsFilters {
  status?: RentalStatus;
}

export function useRentals(filters?: UseRentalsFilters) {
  const { user } = useAuth();
  const [rentals, setRentals] = useState<RentalWithItems[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    if (!user) {
      setRentals([]);
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("rentals")
        .select("*, items:rental_request_items(id, item_id, quantity, unit_price, item:items(name, photos))")
        .eq("user_id", user.id)
        .order("start_datetime", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error: err } = await query;

      if (err) {
        setError(err.message);
      } else {
        setRentals(data as RentalWithItems[]);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [user?.id, filters?.status]);

  return { rentals, isLoading, error, refetch: fetch };
}