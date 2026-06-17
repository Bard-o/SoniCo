import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function useDeleteMaintenanceBlock() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteBlock = async (blockId: string): Promise<boolean> => {
    setIsProcessing(true);
    setError(null);

    try {
      const { error: err } = await supabase
        .from("maintenance_blocks")
        .delete()
        .eq("id", blockId);

      if (err) {
        setError(err.message);
        return false;
      }
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return { deleteBlock, isProcessing, error };
}
