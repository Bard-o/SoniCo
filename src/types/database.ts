export type UserRole = "user" | "owner";

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
    };
  };
}
