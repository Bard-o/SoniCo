import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface CreateReservationItem {
  item_id: string;
  quantity: number;
  unit_price: number;
}

interface CreateReservationParams {
  room_id: string;
  band_name?: string;
  start_time: string;
  end_time: string;
  total_price: number;
  items: CreateReservationItem[];
}

export function useCreateReservation() {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReservation = async (params: CreateReservationParams): Promise<{ id: string } | null> => {
    if (!user) {
      setError("User not authenticated");
      return null;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Client-side overlap check
      const { data: overlapData, error: overlapErr } = await supabase
        .from("reservations")
        .select("id")
        .eq("room_id", params.room_id)
        .in("status", ["pending", "confirmed"])
        .or(`start_time.lt.${params.end_time},end_time.gt.${params.start_time}`);

      if (overlapErr) {
        // Non-fatal: log and continue
        console.warn("[useCreateReservation] Overlap check failed:", overlapErr.message);
      } else if (overlapData && overlapData.length > 0) {
        setError("Ya existe una reserva para este horario. Por favor elegí otro.");
        setIsCreating(false);
        return null;
      }

      // Insert reservation
      const { data: reservationData, error: reservationErr } = await supabase
        .from("reservations")
        .insert({
          user_id: user.id,
          room_id: params.room_id,
          band_name: params.band_name ?? null,
          start_time: params.start_time,
          end_time: params.end_time,
          total_price: params.total_price,
        })
        .select("id")
        .single();

      if (reservationErr) {
        setError(reservationErr.message);
        setIsCreating(false);
        return null;
      }

      // Insert reservation items
      if (params.items.length > 0) {
        const { error: itemsErr } = await supabase.from("reservation_items").insert(
          params.items.map((item) => ({
            reservation_id: reservationData.id,
            item_id: item.item_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
          }))
        );

        if (itemsErr) {
          // Rollback reservation
          await supabase.from("reservations").delete().eq("id", reservationData.id);
          setError(itemsErr.message);
          setIsCreating(false);
          return null;
        }
      }

      setIsCreating(false);

      // Notify owner via email (fire-and-forget)
      supabase.functions.invoke("notify-owner-reservation-requested", {
        body: { reservation_id: reservationData.id },
      }).catch((err) =>
        console.warn("[useCreateReservation] Failed to notify owner:", err)
      );

      return { id: reservationData.id };
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setIsCreating(false);
      return null;
    }
  };

  return { createReservation, isCreating, error };
}