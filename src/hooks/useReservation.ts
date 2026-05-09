import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Reservation, ReservationItem } from "@/types/database";

interface ReservationWithRoom extends Reservation {
  rooms: { name: string; slug: string; photos: string[] } | null;
}

interface ReservationItemWithItem extends ReservationItem {
  items: { name: string; category: string } | null;
}

export function useReservation(id: string | null) {
  const [reservation, setReservation] = useState<ReservationWithRoom | null>(null);
  const [reservationItems, setReservationItems] = useState<ReservationItemWithItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    if (!id) {
      setReservation(null);
      setReservationItems(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data: resData, error: resErr } = await supabase
        .from("reservations")
        .select("*, rooms(name, slug, photos)")
        .eq("id", id)
        .single();

      if (resErr) {
        setError(resErr.message);
        setIsLoading(false);
        return;
      }

      const { data: itemsData, error: itemsErr } = await supabase
        .from("reservation_items")
        .select("*, items(name, category)")
        .eq("reservation_id", id);

      if (itemsErr) {
        setError(itemsErr.message);
      } else {
        setReservation(resData as ReservationWithRoom);
        setReservationItems(itemsData as ReservationItemWithItem[]);
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

  return { reservation, reservationItems, isLoading, error, refetch: fetch };
}