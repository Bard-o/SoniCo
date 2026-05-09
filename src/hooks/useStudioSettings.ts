import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { StudioSettings } from "@/types/database";

export function useStudioSettings() {
  const [settings, setSettings] = useState<StudioSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    try {
      const { data, error: err } = await supabase
        .from("studio_settings")
        .select("*")
        .single();

      if (err) {
        setError(err.message);
      } else {
        setSettings(data);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  return { settings, isLoading, error, refetch: fetch };
}