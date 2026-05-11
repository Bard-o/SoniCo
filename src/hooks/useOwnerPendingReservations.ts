import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface PendingReservationUser {
  id: string;
  full_name: string;
  email: string;
}

interface PendingReservationRoom {
  id: string;
  name: string;
  slug: string;
}

interface PendingReservation {
  id: string;
  user_id: string;
  room_id: string;
  band_name: string | null;
  status: string;
  start_time: string;
  end_time: string;
  total_price: number;
  created_at: string;
  profiles: PendingReservationUser | null;
  rooms: PendingReservationRoom | null;
}

export function useOwnerPendingReservations() {
  const [pendingReservations, setPendingReservations] = useState<PendingReservation[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    try {
      const { data, error: err } = await supabase
        .from("reservations")
        .select("*, profiles(full_name, email), rooms(name, slug)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (err) {
        setError(err.message);
      } else {
        setPendingReservations(data as PendingReservation[]);
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

  const count = pendingReservations?.length ?? 0;

  return { pending: pendingReservations, pendingReservations, count, isLoading, error, refetch: fetch };
}