import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Item } from "@/types/database";

export function useItem(id: string) {
  const [item, setItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItem = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      setError(error.message);
      setItem(null);
    } else {
      setItem(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchItem();
  }, [id]);

  return { item, isLoading, error, refetch: fetchItem };
}
