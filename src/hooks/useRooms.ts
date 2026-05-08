import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Room } from "@/types/database";
import { useToast } from "./use-toast";

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRooms = async () => {
    setIsLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .order("name");

    if (error) {
      setError(error.message);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setRooms(data ?? []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const create = async (room: Omit<Room, "id" | "created_at" | "updated_at">) => {
    const { data, error } = await supabase.from("rooms").insert(room).select().single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
    toast({ title: "Sala creada", description: `${data.name} creada con éxito.` });
    await fetchRooms();
    return data;
  };

  const update = async (id: string, updates: Partial<Room>) => {
    const { data, error } = await supabase
      .from("rooms")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
    toast({ title: "Sala actualizada", description: `${data.name} guardada.` });
    await fetchRooms();
    return data;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
    toast({ title: "Sala eliminada", description: "La sala fue eliminada." });
    await fetchRooms();
  };

  return { rooms, isLoading, error, refetch: fetchRooms, create, update, remove };
}
