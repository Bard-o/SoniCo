import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Room } from "@/types/database";
import { useToast } from "./use-toast";

export type ReservationStatus = "pending" | "confirmed" | "denied" | "cancelled";

export interface ReservationItem {
  id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  item?: { name: string };
}

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
  created_at: string;
  updated_at: string;
  room?: Room;
  items?: ReservationItem[];
}

interface UseReservationsReturn {
  reservations: Reservation[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useReservations(): UseReservationsReturn {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchReservations = async () => {
    setIsLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setReservations([]);
      setIsLoading(false);
      return;
    }

    const { data, error: err } = await supabase
      .from("reservations")
      .select(`
        *,
        room:rooms(*),
        items:reservation_items(item:items(name), quantity, unit_price)
      `)
      .eq("user_id", user.id)
      .order("start_time", { ascending: false });

    if (err) {
      setError(err.message);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } else {
      // Flatten items
      const flattened = (data ?? []).map((r: Record<string, unknown>) => ({
        ...r,
        items: (r.items as unknown[]).map((i: Record<string, unknown>) => ({
          ...(i as Record<string, unknown>),
          item: (i as Record<string, unknown>).item as { name: string },
        })),
      }));
      setReservations(flattened);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  return { reservations, isLoading, error, refetch: fetchReservations };
}

interface UseReservationDetailReturn {
  reservation: Reservation | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useReservationDetail(id: string): UseReservationDetailReturn {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchReservation = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from("reservations")
      .select(`
        *,
        room:rooms(*),
        items:reservation_items(item:items(name), quantity, unit_price)
      `)
      .eq("id", id)
      .single();

    if (err) {
      setError(err.message);
    } else if (data) {
      setReservation({
        ...data,
        items: (data.items as unknown[]).map((i: Record<string, unknown>) => ({
          ...(i as Record<string, unknown>),
          item: (i as Record<string, unknown>).item as { name: string },
        })),
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReservation();
  }, [id]);

  return { reservation, isLoading, error, refetch: fetchReservation };
}

interface UseWithdrawReservationReturn {
  withdraw: (id: string) => Promise<void>;
  isLoading: boolean;
}

export function useWithdrawReservation(onSuccess?: () => void): UseWithdrawReservationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const withdraw = async (id: string) => {
    setIsLoading(true);
    const { error } = await supabase
      .from("reservations")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "pending");

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reserva retirada", description: "Tu solicitud fue retirada." });
      onSuccess?.();
    }
    setIsLoading(false);
  };

  return { withdraw, isLoading };
}

interface UseOwnerPendingReservationsReturn {
  pending: Reservation[];
  count: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useOwnerPendingReservations(): UseOwnerPendingReservationsReturn {
  const [pending, setPending] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPending = async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from("reservations")
      .select(`
        *,
        room:rooms(*),
        items:reservation_items(item:items(name), quantity, unit_price)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (err) {
      setError(err.message);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } else {
      const flattened = (data ?? []).map((r: Record<string, unknown>) => ({
        ...r,
        items: (r.items as unknown[]).map((i: Record<string, unknown>) => ({
          ...(i as Record<string, unknown>),
          item: (i as Record<string, unknown>).item as { name: string },
        })),
      }));
      setPending(flattened);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  return { pending, count: pending.length, isLoading, error, refetch: fetchPending };
}