import { ArrowUpRight, CalendarCheck, Clock, DoorOpen, Inbox } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useOwnerPendingReservations } from "@/hooks/useOwnerPendingReservations";
import { useOwnerPendingRentals } from "@/hooks/useOwnerPendingRentals";

// --- Types ---

interface PendingReservation {
  id: string;
  user_id: string;
  room_id: string;
  band_name: string | null;
  status: string;
  start_time: string;
  end_time: string;
  total_price: number;
  created_at: string;
  profiles: { full_name: string; email: string } | null;
  rooms: { name: string; slug: string } | null;
}

interface PendingRental {
  id: string;
  user_id: string;
  band_or_event_name: string | null;
  details: string | null;
  status: string;
  start_datetime: string;
  end_datetime: string;
  total_price: number;
  created_at: string;
  profiles: { full_name: string; email: string } | null;
}

interface PendingItem {
  id: string;
  type: "reservation" | "rental";
  userName: string;
  title: string;
  dateStr: string;
  timeStr: string;
  extra: string;
  created_at: string;
}

// --- Stub data ---

const rooms = [
  { name: "Studio A — The Live Room", slug: "studio-a" },
  { name: "Studio B — The Vintage Room", slug: "studio-b" },
  { name: "Studio C — The Composer Suite", slug: "studio-c" },
];

const stats = [
  { label: "Reservas esta semana", value: "23", hint: "+12% vs. semana pasada", icon: CalendarCheck },
  { label: "Alquileres esta semana", value: "11", hint: "8 confirmados", icon: Clock },
  { label: "Salas activas", value: "3", hint: "1 en mantenimiento", icon: DoorOpen },
];

const today = [
  { id: "t1", time: "10:00 — 11:30", room: rooms[1].name, user: "Daniel Ruiz" },
  { id: "t2", time: "14:00 — 16:00", room: rooms[0].name, user: "Banda Aurora" },
  { id: "t3", time: "18:00 — 20:00", room: rooms[0].name, user: "Echo Drift" },
];

// --- Helpers ---

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "hace menos de 1 hora";
  if (diffHours < 24) return `hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
  const diffDays = Math.floor(diffHours / 24);
  return `hace ${diffDays} día${diffDays > 1 ? "s" : ""}`;
}

function formatDateTime(dateStr: string, endStr: string) {
  const startDate = new Date(dateStr);
  const endDate = new Date(endStr);
  const dateStr2 = startDate.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeStr = `${startDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} — ${endDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
  return { dateStr: dateStr2, timeStr };
}

function makeReservationItem(r: PendingReservation): PendingItem {
  const { dateStr, timeStr } = formatDateTime(r.start_time, r.end_time);
  return {
    id: r.id,
    type: "reservation",
    userName: r.profiles?.full_name ?? "Usuario desconocido",
    title: r.rooms?.name ?? "Sala",
    dateStr,
    timeStr,
    extra: r.band_name ?? "",
    created_at: r.created_at,
  };
}

function makeRentalItem(r: PendingRental): PendingItem {
  const { dateStr, timeStr } = formatDateTime(r.start_datetime, r.end_datetime);
  return {
    id: r.id,
    type: "rental",
    userName: r.profiles?.full_name ?? "Usuario desconocido",
    title: "Alquiler de equipos",
    dateStr,
    timeStr,
    extra: r.band_or_event_name ?? "",
    created_at: r.created_at,
  };
}

// --- Component ---

const OwnerDashboard = () => {
  const { profile } = useAuth();
  const { pending, count: resCount, isLoading: resLoading } = useOwnerPendingReservations();
  const { pendingRentals, count: rentCount, isLoading: rentLoading } = useOwnerPendingRentals();

  const firstName = profile?.full_name?.split(" ")[0] ?? "admin";
  const isLoading = resLoading || rentLoading;
  const totalPendingCount = resCount + rentCount;

  // Combine and sort recent items
  const recentItems: PendingItem[] = [
    ...(pending ?? []).map(makeReservationItem),
    ...(pendingRentals ?? []).map(makeRentalItem),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  return (
    <AppShell role="owner">
      {/* Hero */}
      <section className="border-b border-border gradient-warm">
        <div className="container-app py-14">
          <p className="eyebrow">— Panel del estudio</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <h1 className="display-hero">Hola, {firstName}.</h1>
            <p className="text-[15px] text-foreground/70">Martes, 5 de mayo de 2026</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container-app -mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pending stat — combined reservations + rentals */}
        <div className="card-surface bg-card p-5 shadow-warm-md">
          <div className="flex items-start justify-between">
            <p className="text-xs uppercase tracking-wider text-foreground/60">Solicitudes pendientes</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-sm gradient-block text-foreground">
              <Inbox className="h-4 w-4" />
            </span>
          </div>
          {isLoading ? (
            <Skeleton className="mt-4 h-10 w-16" />
          ) : (
            <p className="mt-4 text-4xl tracking-tight">{totalPendingCount}</p>
          )}
          <p className="mt-1 text-xs text-foreground/55">Requieren tu revisión</p>
        </div>

        {/* Other stats — stubs */}
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card-surface bg-card p-5">
              <div className="flex items-start justify-between">
                <p className="text-xs uppercase tracking-wider text-foreground/60">{s.label}</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-secondary text-foreground/70">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-4 text-4xl tracking-tight">{s.value}</p>
              <p className="mt-1 text-xs text-foreground/55">{s.hint}</p>
            </div>
          );
        })}
      </section>

      {/* Content Grid */}
      <section className="container-app grid gap-8 py-12 lg:grid-cols-5">
        {/* Recent pending — combined reservations + rentals */}
        <div className="card-surface bg-card p-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="sub-heading">Solicitudes recientes</h2>
              <p className="mt-1 text-sm text-foreground/65">Revisa y aprueba o deniega rápidamente.</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link to="/owner/pending">
                Ver todas <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="mt-6 space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2 py-4">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))}
            </div>
          ) : recentItems.length === 0 ? (
            <p className="mt-6 text-sm text-foreground/60">No hay solicitudes pendientes.</p>
          ) : (
            <div className="mt-6 divide-y divide-border">
              {recentItems.map((item) => (
                <div key={`${item.type}-${item.id}`} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-5">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-0.5 text-sm text-foreground/70">
                      {item.dateStr} · {item.timeStr}
                    </p>
                    <p className="mt-1 text-xs text-foreground/50">
                      {item.type === "reservation" ? "Banda" : "Evento"}: {item.extra || "—"} · Enviado {formatRelativeTime(item.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                      <Link to="/owner/pending">Denegar</Link>
                    </Button>
                    <Button asChild variant="cta" size="sm">
                      <Link to="/owner/pending">Aprobar</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's sessions */}
        <div className="card-surface bg-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="sub-heading">Hoy</h2>
            <span className="chip">{today.length} sesiones</span>
          </div>
          <div className="mt-6 space-y-4">
            {today.map((t) => (
              <div key={t.id} className="flex gap-4 border-l-2 border-foreground pl-4">
                <div>
                  <p className="text-sm font-medium tracking-tight">{t.time}</p>
                  <p className="mt-0.5 text-sm text-foreground/70">{t.room}</p>
                  <p className="text-xs text-foreground/50">{t.user}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default OwnerDashboard;