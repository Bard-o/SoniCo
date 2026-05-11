import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface DenyResult {
  success: boolean;
  error?: string;
  data?: { success?: boolean; rental_id?: string; reservation_id?: string };
}

export function useDenyReservation() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const denyReservation = async (
    reservationId: string,
    ownerMessage?: string
  ): Promise<DenyResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "deny-reservation",
        {
          body: {
            reservation_id: reservationId,
            owner_message: ownerMessage ?? null,
          },
        }
      );

      if (fnError) {
        const serverError = fnError.context as { error?: string } | undefined;
        setError(serverError?.error ?? fnError.message);
        return { success: false, error: serverError?.error ?? fnError.message };
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

  return { denyReservation, isProcessing, error };
}
