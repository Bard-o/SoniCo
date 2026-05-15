import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface DenyResult {
  success: boolean;
  error?: string;
  data?: { success?: boolean; rental_id?: string; reservation_id?: string };
}

export function useDenyRental() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const denyRental = async (
    rentalId: string,
    ownerMessage?: string
  ): Promise<DenyResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "deny-rental",
        {
          body: {
            rental_id: rentalId,
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

  return { denyRental, isProcessing, error };
}
