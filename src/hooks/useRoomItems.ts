import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Item } from "@/types/database";
import { useToast } from "./use-toast";

interface LinkedItem extends Item {
  linkedQuantity: number;
}

export function useRoomItems(roomId: string) {
  const [linkedItems, setLinkedItems] = useState<LinkedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLinkedItems = useCallback(async () => {
    if (!roomId) return;
    setIsLoading(true);
    setError(null);

    const { data: links, error: linksError } = await supabase
      .from("room_items")
      .select("item_id, quantity")
      .eq("room_id", roomId);

    if (linksError) {
      setError(linksError.message);
      setIsLoading(false);
      return;
    }

    if (links && links.length > 0) {
      const itemIds = links.map((l) => l.item_id);
      const { data: itemsData } = await supabase
        .from("items")
        .select("*")
        .in("id", itemIds);

      const itemsWithQty = (itemsData ?? []).map((item) => {
        const link = links.find((l) => l.item_id === item.id);
        return { ...item, linkedQuantity: link?.quantity ?? 1 };
      });
      setLinkedItems(itemsWithQty);
    } else {
      setLinkedItems([]);
    }
    setIsLoading(false);
  }, [roomId]);

  useEffect(() => {
    fetchLinkedItems();
  }, [fetchLinkedItems]);

  const getAvailableQuantity = async (itemId: string): Promise<number> => {
    if (!roomId) return 0;
    // Get total quantity of item
    const { data: item } = await supabase
      .from("items")
      .select("quantity")
      .eq("id", itemId)
      .single();
    if (!item) return 0;

    // Get quantity linked to OTHER rooms (excluding this room)
    const { data: otherLinks } = await supabase
      .from("room_items")
      .select("quantity")
      .eq("item_id", itemId)
      .neq("room_id", roomId);

    const linkedElsewhere = (otherLinks ?? []).reduce((sum, l) => sum + l.quantity, 0);
    return item.quantity - linkedElsewhere;
  };

  const link = async (itemId: string, quantity: number) => {
    // Validate quantity
    const available = await getAvailableQuantity(itemId);
    if (quantity > available) {
      const msg = `Solo ${available} unidad${available !== 1 ? "es" : ""} disponible${available !== 1 ? "s" : ""} para enlazar.`;
      toast({ title: "No disponible", description: msg, variant: "destructive" });
      throw new Error(msg);
    }

    // Check if link already exists
    const { data: existing } = await supabase
      .from("room_items")
      .select("id")
      .eq("room_id", roomId)
      .eq("item_id", itemId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from("room_items")
        .update({ quantity })
        .eq("id", existing.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        throw error;
      }
    } else {
      const { error } = await supabase
        .from("room_items")
        .insert({ room_id: roomId, item_id: itemId, quantity });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        throw error;
      }
    }
    toast({ title: "Ítem enlazado", description: "Equipo enlazado a la sala." });
    await fetchLinkedItems();
  };

  const unlink = async (itemId: string) => {
    const { error } = await supabase
      .from("room_items")
      .delete()
      .eq("room_id", roomId)
      .eq("item_id", itemId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
    toast({ title: "Ítem desenlazado", description: "Equipo removido de la sala." });
    await fetchLinkedItems();
  };

  return { linkedItems, isLoading, error, refetch: fetchLinkedItems, link, unlink };
}
