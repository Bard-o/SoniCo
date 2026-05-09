import { ArrowUpRight, CalendarCheck, Clock, DoorOpen, Inbox } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useOwnerPendingReservations } from "@/hooks/useReservations";

// Stub data for sections not yet wired
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

const OwnerDashboard = () => {
  const { profile } = useAuth();
  const { pending, count: pendingCount, isLoading: pendingLoading } = useOwnerPendingReservations();
  const firstName = profile?.full_name?.split(" ")[0] ?? "admin";

  return (
    <AppShell role="owner">
      <section className="border-b border-border gradient-warm">
        <div className="container-app py-14">
          <p className="eyebrow">— Panel del estudio</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <h1 className="display-hero">Hola, {firstName}.</h1>
            <p className="text-[15px] text-foreground/70">Martes, 5 de mayo de 2026</p>
          </div>
        </div>
      </section>

      <section className="container-app -mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pending stat — wired */}
        <div className="card-surface bg-card p-5 shadow-warm-md">
          <div className="flex items-start justify-between">
            <p className="text-xs uppercase tracking-wider text-foreground/60">Solicitudes pendientes</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-sm gradient-block text-foreground">
              <Inbox className="h-4 w-4" />
            </span>
          </div>
          {pendingLoading ? (
            <Skeleton className="mt-4 h-10 w-16" />
          ) : (
            <p className="mt-4 text-4xl tracking-tight">{pendingCount}</p>
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

      <section className="container-app grid gap-8 py-12 lg:grid-cols-5">
        {/* Recent pending — wired from real data */}
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

          {pendingLoading ? (
            <div className="mt-6 space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2 py-4">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))}
            </div>
          ) : pending.length === 0 ? (
            <p className="mt-6 text-sm text-foreground/60">No hay solicitudes pendientes.</p>
          ) : (
            <div className="mt-6 divide-y divide-border">
              {pending.slice(0, 3).map((r) => {
                const startDate = new Date(r.start_time);
                const endDate = new Date(r.end_time);
                const dateStr = startDate.toLocaleDateString("es-ES", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                });
                const timeStr = `${startDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} — ${endDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;

                return (
                  <div key={r.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-5">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{r.room?.name ?? "Sala"}</p>
                      <p className="mt-0.5 text-sm text-foreground/70">
                        {dateStr} · {timeStr}
                      </p>
                      <p className="mt-1 text-xs text-foreground/50">
                        Banda: {r.band_name ?? "—"} · Enviado {formatRelativeTime(r.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                        Denegar
                      </Button>
                      <Button variant="cta" size="sm">
                        Aprobar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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