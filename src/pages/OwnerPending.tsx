import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerPendingReservations } from "@/hooks/useReservations";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

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

const OwnerPending = () => {
  const { profile } = useAuth();
  const { pending, isLoading, error, refetch } = useOwnerPendingReservations();

  const firstName = profile?.full_name?.split(" ")[0] ?? "admin";

  return (
    <AppShell role="owner">
      <section className="border-b border-border gradient-warm">
        <div className="container-app py-8">
          <Link
            to="/owner"
            className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al dashboard
          </Link>
        </div>
      </section>

      <section className="border-b border-border gradient-warm">
        <div className="container-app py-14">
          <p className="eyebrow">— Revisión</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="display-hero">Solicitudes pendientes</h1>
              <p className="mt-3 max-w-lg text-[15px] text-foreground/70">
                Revisa las solicitudes de reserva pendientes y apruébalas o denegarlas.
              </p>
            </div>
            <span
              className={cn(
                "inline-flex items-center rounded-sm px-3 py-1.5 text-sm font-medium",
                pending.length > 0
                  ? "bg-warning-soft text-foreground"
                  : "bg-muted text-foreground/60",
              )}
            >
              {pending.length} pendiente{pending.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </section>

      <section className="container-app py-12">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card-surface flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-72" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="text-foreground/60">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : pending.length === 0 ? (
          <div className="text-center">
            <p className="text-foreground/60">No hay solicitudes pendientes.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((r) => {
              const startDate = new Date(r.start_time);
              const endDate = new Date(r.end_time);
              const dateStr = startDate.toLocaleDateString("es-ES", {
                weekday: "short",
                day: "numeric",
                month: "short",
              });
              const timeStr = `${startDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} — ${endDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;

              return (
                <div
                  key={r.id}
                  className="card-surface flex flex-col gap-4 p-6 sm:flex-row sm:items-center"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{r.room?.name ?? "Sala"}</p>
                    <p className="mt-0.5 text-sm text-foreground/70">
                      {dateStr} · {timeStr}
                    </p>
                    {r.band_name && (
                      <p className="mt-1 text-xs text-foreground/50">Banda: {r.band_name}</p>
                    )}
                    <p className="mt-1 text-xs text-foreground/50">
                      Enviado {formatRelativeTime(r.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                    >
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
      </section>
    </AppShell>
  );
};

export default OwnerPending;