import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface CancelResult {
  success: boolean;
  error?: string;
  data?: {
    hours_until_start?: string;
    min_hours_required?: number;
  };
}

export function useCancelReservation() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelReservation = async (
    reservationId: string
  ): Promise<CancelResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "cancel-reservation",
        { body: { reservation_id: reservationId } }
      );

      if (fnError) {
        const serverError = fnError.context as { error?: string } | undefined;
        const msg = serverError?.error ?? fnError.message;
        setError(msg);
        return { success: false, error: msg };
      }

      setIsProcessing(false);
      return { success: true, data };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setError(msg);
      setIsProcessing(false);
      return { success: false, error: msg };
    }
  };

  return { cancelReservation, isProcessing, error };
}
