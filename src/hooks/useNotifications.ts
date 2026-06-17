import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Notification, NotificationType } from "@/types/database";

export interface NotificationWithMeta extends Notification {
  // Additional computed fields for UI
  icon: "check" | "x" | "ban" | "bell";
  iconColor: string;
}

const TYPE_META: Record<NotificationType, { icon: NotificationWithMeta["icon"]; iconColor: string }> = {
  reservation_confirmed: { icon: "check", iconColor: "text-green-600" },
  reservation_denied: { icon: "x", iconColor: "text-red-600" },
  reservation_cancelled: { icon: "ban", iconColor: "text-muted-foreground" },
  reservation_requested: { icon: "bell", iconColor: "text-blue-600" },
  rental_confirmed: { icon: "check", iconColor: "text-green-600" },
  rental_denied: { icon: "x", iconColor: "text-red-600" },
  rental_cancelled: { icon: "ban", iconColor: "text-muted-foreground" },
  rental_requested: { icon: "bell", iconColor: "text-blue-600" },
};

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "justo ahora";
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours} h`;
  if (diffDays < 7) return `hace ${diffDays} días`;
  return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationWithMeta[] | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: err } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (err) {
        setError(err.message);
      } else {
        const withMeta: NotificationWithMeta[] = (data as Notification[]).map((n) => ({
          ...n,
          ...TYPE_META[n.type],
          // Override icon color for cancelled
          iconColor: n.type.endsWith("_cancelled") ? "text-muted-foreground" : TYPE_META[n.type].iconColor,
        }));
        setNotifications(withMeta);
        setUnreadCount(withMeta.filter((n) => !n.is_read).length);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [user?.id]);

  return { notifications, unreadCount, isLoading, error, refetch: fetch, getRelativeTime };
}
