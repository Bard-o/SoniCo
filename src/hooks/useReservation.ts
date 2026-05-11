import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Reservation, ReservationStatus } from "@/types/database";

interface ReservationDetailRoom {
  id: string;
  name: string;
  slug: string;
  photos: string[];
  price_per_half_hour: number;
}

interface ReservationDetailItem {
  id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  item: { name: string } | null;
}

interface ReservationDetail extends Reservation {
  room: ReservationDetailRoom | null;
  items: ReservationDetailItem[];
}

export function useReservation(id: string | null) {
  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    if (!id) {
      setReservation(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: err } = await supabase
        .from("reservations")
        .select(`
          *,
          room:rooms(id, name, slug, photos, price_per_half_hour),
          items:reservation_items(id, item_id, quantity, unit_price, item:items(name))
        `)
        .eq("id", id)
        .single();

      if (err) {
        setError(err.message);
      } else {
        setReservation(data as unknown as ReservationDetail);
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

  return { reservation, isLoading, error, refetch: fetch };
}