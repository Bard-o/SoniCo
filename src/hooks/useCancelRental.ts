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

export function useCancelRental() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelRental = async (rentalId: string): Promise<CancelResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "cancel-rental",
        { body: { rental_id: rentalId } }
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

  return { cancelRental, isProcessing, error };
}
