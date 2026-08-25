import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function useOwnerCancelReservation() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelReservation = async (
    reservationId: string,
    ownerMessage?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsProcessing(true);
    setError(null);

    try {
      const { error: fnError } = await supabase.functions.invoke(
        "owner-cancel-reservation",
        { body: { reservation_id: reservationId, owner_message: ownerMessage ?? null } }
      );

      if (fnError) {
        const serverError = fnError.context as { error?: string } | undefined;
        const msg = serverError?.error ?? fnError.message;
        setError(msg);
        return { success: false, error: msg };
      }

      setIsProcessing(false);
      return { success: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setError(msg);
      setIsProcessing(false);
      return { success: false, error: msg };
    }
  };

  return { cancelReservation, isProcessing, error };
}
