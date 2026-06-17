import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { MaintenanceBlock } from "@/types/database";

export function useMaintenanceBlocks(params: { room_id?: string; item_id?: string; futureOnly?: boolean } = {}) {
  const [blocks, setBlocks] = useState<MaintenanceBlock[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    if (!params.room_id && !params.item_id) {
      setBlocks([]);
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("maintenance_blocks")
        .select("*")
        .order("start_datetime", { ascending: true });

      if (params.room_id) {
        query = query.eq("room_id", params.room_id);
      }
      if (params.item_id) {
        query = query.eq("item_id", params.item_id);
      }
      if (params.futureOnly) {
        query = query.gt("start_datetime", new Date().toISOString());
      }

      const { data, error: err } = await query;
      if (err) throw err;
      setBlocks(data as MaintenanceBlock[]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [params.room_id, params.item_id, params.futureOnly]);

  return { blocks, isLoading, error, refetch: fetch };
}
