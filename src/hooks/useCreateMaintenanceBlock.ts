import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function useCreateMaintenanceBlock() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBlock = async (params: {
    room_id?: string;
    item_id?: string;
    start_datetime: string;
    end_datetime: string;
    reason: string;
  }): Promise<{ success: boolean; error?: string; data?: { affected_reservations: number } }> => {
    setIsProcessing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "create-maintenance-block",
        { body: params }
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

  return { createBlock, isProcessing, error };
}
