import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Item, ItemCategory } from "@/types/database";
import { useToast } from "./use-toast";

export function useItems(categoryFilter?: ItemCategory) {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchItems = async () => {
    setIsLoading(true);
    setError(null);
    let query = supabase.from("items").select("*").order("name");
    if (categoryFilter) {
      query = query.eq("category", categoryFilter);
    }
    const { data, error } = await query;

    if (error) {
      setError(error.message);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setItems(data ?? []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [categoryFilter]);

  const create = async (item: Omit<Item, "id" | "created_at" | "updated_at">) => {
    console.log("[useItems.create] called with:", JSON.stringify(item, null, 2));
    try {
      const result = await supabase.from("items").insert(item).select();
      console.log("[useItems.create] result:", result);
      const { data, error } = result;
      if (error) {
        console.error("[useItems.create] error:", error);
        toast({ title: "Error", description: error.message, variant: "destructive" });
        throw error;
      }
      const created = data?.[0];
      if (!created) {
        const msg = "No se recibió confirmación del servidor";
        console.error("[useItems.create]", msg);
        throw new Error(msg);
      }
      toast({ title: "Ítem creado", description: `${created.name} creado con éxito.` });
      await fetchItems();
      return created;
    } catch (err) {
      console.error("[useItems.create] unexpected error:", err);
      throw err;
    }
  };

  const update = async (id: string, updates: Partial<Item>) => {
    const { data, error } = await supabase
      .from("items")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
    toast({ title: "Ítem actualizado", description: `${data.name} guardado.` });
    await fetchItems();
    return data;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
    toast({ title: "Ítem eliminado", description: "El ítem fue eliminado." });
    await fetchItems();
  };

  return { items, isLoading, error, refetch: fetchItems, create, update, remove };
}
