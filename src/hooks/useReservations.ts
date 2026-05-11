import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { ReservationStatus } from "@/types/database";

export interface ReservationWithRoom {
  id: string;
  user_id: string;
  room_id: string;
  band_name: string | null;
  status: ReservationStatus;
  start_time: string;
  end_time: string;
  total_price: number;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  room: { name: string; slug: string; photos: string[] } | null;
  items?: { id: string; item_id: string; quantity: number; unit_price: number; item?: { name: string } }[];
}

interface UseReservationsFilters {
  status?: ReservationStatus;
}

export function useReservations(filters?: UseReservationsFilters) {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<ReservationWithRoom[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    if (!user) {
      setReservations([]);
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("reservations")
        .select("*, room:rooms(name, slug, photos)")
        .eq("user_id", user.id)
        .order("start_time", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error: err } = await query;

      if (err) {
        setError(err.message);
      } else {
        setReservations(data as ReservationWithRoom[]);
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

  return { reservations, isLoading, error, refetch: fetch };
}