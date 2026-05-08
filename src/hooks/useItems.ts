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
      // Bypass supabase-js entirely — getSession hangs due to gotrue clock skew
      const sbToken = localStorage.getItem("sb-rxudtsesweqyywqomcmf-auth-token");
      const parsed = sbToken ? JSON.parse(sbToken) : null;
      const token = parsed?.access_token;
      console.log("[useItems.create] token from localStorage:", !!token, token ? token.slice(0, 10) + "..." : "NONE");

      if (!token) {
        throw new Error("No hay sesión activa. Inicia sesión de nuevo.");
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
      
      const url = `${supabaseUrl}/rest/v1/items`;
      console.log("[useItems.create] POST", url);
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
          Authorization: `Bearer ${token}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify(item),
      });
      
      console.log("[useItems.create] response status:", response.status);
      
      if (!response.ok) {
        const errBody = await response.text();
        console.error("[useItems.create] HTTP error:", response.status, errBody);
        const msg = `Error del servidor (${response.status})`;
        toast({ title: "Error", description: msg, variant: "destructive" });
        throw new Error(msg);
      }
      
      const data = await response.json();
      console.log("[useItems.create] data:", data);
      const created = Array.isArray(data) ? data[0] : data;
      
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
