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

export type NotificationType =
  | "reservation_confirmed"
  | "reservation_denied"
  | "reservation_cancelled"
  | "reservation_requested"
  | "rental_confirmed"
  | "rental_denied"
  | "rental_cancelled"
  | "rental_requested";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  message: string;
  owner_message: string | null;
  is_read: boolean;
  created_at: string;
}

export type ReservationStatus = "pending" | "confirmed" | "denied" | "cancelled";

export interface Reservation {
  id: string;
  user_id: string;
  room_id: string;
  band_name: string | null;
  status: ReservationStatus;
  start_time: string;
  end_time: string;
  total_price: number;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  owner_message: string | null;
  created_at: string;
  updated_at: string;
}

export type RentalStatus = "pending" | "confirmed" | "denied" | "cancelled";

export interface Rental {
  id: string;
  user_id: string;
  band_or_event_name: string | null;
  details: string | null;
  start_datetime: string;
  end_datetime: string;
  status: RentalStatus;
  total_price: number;
  owner_message: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RentalItemRecord {
  id: string;
  rental_id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface ReservationItem {
  id: string;
  reservation_id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface MaintenanceBlock {
  id: string;
  room_id: string | null;
  item_id: string | null;
  start_datetime: string;
  end_datetime: string;
  reason: string;
  created_at: string;
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
      reservations: {
        Row: Reservation;
        Insert: Omit<Reservation, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Reservation, "id" | "created_at">>;
      };
      reservation_items: {
        Row: ReservationItem;
        Insert: Omit<ReservationItem, "id" | "created_at">;
        Update: Partial<Omit<ReservationItem, "id" | "created_at">>;
      };
      rentals: {
        Row: Rental;
        Insert: Omit<Rental, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Rental, "id" | "created_at">>;
      };
rental_request_items: {
        Row: RentalItemRecord;
        Insert: Omit<RentalItemRecord, "id" | "created_at">;
        Update: Partial<Omit<RentalItemRecord, "id" | "created_at">>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, "id" | "created_at">;
        Update: Partial<Omit<Notification, "id" | "created_at">>;
      };
      maintenance_blocks: {
        Row: MaintenanceBlock;
        Insert: Omit<MaintenanceBlock, "id" | "created_at">;
        Update: Partial<Omit<MaintenanceBlock, "id" | "created_at">>;
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
