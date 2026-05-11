import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface PendingRentalUser {
  id: string;
  full_name: string;
  email: string;
}

interface PendingRental {
  id: string;
  user_id: string;
  band_or_event_name: string | null;
  details: string | null;
  status: string;
  start_datetime: string;
  end_datetime: string;
  total_price: number;
  created_at: string;
  profiles: PendingRentalUser | null;
}

export function useOwnerPendingRentals() {
  const [pendingRentals, setPendingRentals] = useState<PendingRental[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    try {
      const { data, error: err } = await supabase
        .from("rentals")
        .select("*, profiles(full_name, email)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (err) {
        setError(err.message);
      } else {
        setPendingRentals(data as PendingRental[]);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const count = pendingRentals?.length ?? 0;

  return { pendingRentals, count, isLoading, error, refetch: fetch };
}