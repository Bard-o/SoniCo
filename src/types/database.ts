export type UserRole = "user" | "owner";

export const ITEM_CATEGORIES = [
  "Percusión",
  "Amplificadores guitarra",
  "Amplificadores bajo",
  "Teclados",
  "Micrófonos",
  "Consola",
  "Monitores",
  "Pedales",
  "Cables y accesorios",
  "Otros",
] as const;

export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudioSettings {
  id: string;
  hours_per_day: Record<string, [number, number]>;
  min_cancellation_hours: number;
}

export interface Room {
  id: string;
  slug: string;
  name: string;
  description: string;
  photos: string[];
  price_per_half_hour: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  photos: string[];
  quantity: number;
  price_addon: number;
  price_rental: number;
  is_available_for_rental: boolean;
  is_for_sale: boolean;
  sale_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface RentalItem extends Item {
  available_units: number;
}

export interface RoomItem {
  id: string;
  room_id: string;
  item_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

// Supabase-generated types for use with createClient<Database>
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      studio_settings: {
        Row: StudioSettings;
        Insert: Omit<StudioSettings, "id">;
        Update: Partial<Omit<StudioSettings, "id">>;
      };
      rooms: {
        Row: Room;
        Insert: Omit<Room, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Room, "id" | "created_at">>;
      };
      items: {
        Row: Item;
        Insert: Omit<Item, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Item, "id" | "created_at">>;
      };
      room_items: {
        Row: RoomItem;
        Insert: Omit<RoomItem, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<RoomItem, "id" | "created_at">>;
      };
    };
    Views: {
      rental_items: {
        Row: RentalItem;
        Insert: never;
        Update: never;
      };
    };
  };
}
