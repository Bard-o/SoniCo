import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface CreateRentalItem {
  item_id: string;
  quantity: number;
  unit_price: number;
}

interface CreateRentalParams {
  band_or_event_name?: string;
  details?: string;
  start_datetime: string;
  end_datetime: string;
  total_price: number;
  items: CreateRentalItem[];
}

export function useCreateRental() {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRental = async (params: CreateRentalParams): Promise<{ id: string } | null> => {
    if (!user) {
      setError("User not authenticated");
      return null;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Insert rental (no overlap check for rentals — availability checked at approval time)
      const { data: rentalData, error: rentalErr } = await supabase
        .from("rentals")
        .insert({
          user_id: user.id,
          band_or_event_name: params.band_or_event_name ?? null,
          details: params.details ?? null,
          start_datetime: params.start_datetime,
          end_datetime: params.end_datetime,
          total_price: params.total_price,
        })
        .select("id")
        .single();

      if (rentalErr) {
        setError(rentalErr.message);
        setIsCreating(false);
        return null;
      }

      // Insert rental items
      if (params.items.length > 0) {
        const { error: itemsErr } = await supabase.from("rental_request_items").insert(
          params.items.map((item) => ({
            rental_id: rentalData.id,
            item_id: item.item_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
          }))
        );

        if (itemsErr) {
          // Rollback rental
          await supabase.from("rentals").delete().eq("id", rentalData.id);
          setError(itemsErr.message);
          setIsCreating(false);
          return null;
        }
      }

      setIsCreating(false);
      return { id: rentalData.id };
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setIsCreating(false);
      return null;
    }
  };

  return { createRental, isCreating, error };
}