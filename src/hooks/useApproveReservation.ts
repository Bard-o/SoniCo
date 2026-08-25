import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface ApproveResult {
  success: boolean;
  error?: string;
  data?: {
    conflicts?: number;
    conflict_ids?: string[];
    message?: string;
    approved?: boolean;
    reservation_id?: string;
    // A confirmed rental occupying the same slot — see approve-reservation.
    cross_conflicts?: number;
    cross_conflict_ids?: string[];
    cross_conflict_type?: "rental";
  };
}

export function useApproveReservation() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approveReservation = async (
    reservationId: string,
    ownerMessage?: string,
    confirm?: boolean
  ): Promise<ApproveResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "approve-reservation",
        {
          body: {
            reservation_id: reservationId,
            owner_message: ownerMessage ?? null,
            confirm: confirm ?? false,
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

  return { approveReservation, isProcessing, error };
}
