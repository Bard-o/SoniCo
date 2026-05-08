import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Room, Item, RoomItem } from "@/types/database";

export function useRoom(slug: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [linkedItems, setLinkedItems] = useState<(Item & { linkedQuantity: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoom = async () => {
    if (!slug) return;
    setIsLoading(true);
    setError(null);

    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .select("*")
      .eq("slug", slug)
      .single();

    if (roomError) {
      setError(roomError.message);
      setRoom(null);
      setIsLoading(false);
      return;
    }

    setRoom(roomData);

    // Fetch linked items via room_items join
    const { data: links } = await supabase
      .from("room_items")
      .select("item_id, quantity")
      .eq("room_id", roomData.id);

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
  };

  useEffect(() => {
    fetchRoom();
  }, [slug]);

  return { room, linkedItems, isLoading, error, refetch: fetchRoom };
}
