import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export function useWithdrawRental() {
  const { user } = useAuth();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withdraw = async (rentalId: string): Promise<boolean> => {
    if (!user) {
      setError("User not authenticated");
      return false;
    }

    setIsWithdrawing(true);
    setError(null);

    try {
      const { error: updateErr } = await supabase
        .from("rentals")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", rentalId)
        .eq("user_id", user.id) // RLS also enforces this, but explicit for clarity
        .eq("status", "pending"); // Only pending rentals can be withdrawn

      if (updateErr) {
        setError(updateErr.message);
        setIsWithdrawing(false);
        return false;
      }

      setIsWithdrawing(false);
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setIsWithdrawing(false);
      return false;
    }
  };

  return { withdraw, isWithdrawing, error };
}