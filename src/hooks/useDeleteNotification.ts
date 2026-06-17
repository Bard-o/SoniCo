import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function useDeleteNotification() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteNotification = async (notificationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: err } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (err) {
        setError(err.message);
        return false;
      }
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteNotification, isLoading, error };
}
