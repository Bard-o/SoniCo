import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Clock, Music2 } from "lucide-react";
import { AppShell, StatusBadge } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useReservations, useWithdrawReservation } from "@/hooks/useReservations";
import { cn } from "@/lib/utils";
import type { Reservation, ReservationStatus } from "@/hooks/useReservations";

const filters: { key: ReservationStatus | "all"; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "pending", label: "Pendientes" },
  { key: "confirmed", label: "Confirmadas" },
  { key: "denied", label: "Denegadas" },
  { key: "cancelled", label: "Canceladas" },
];

function formatDateTime(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const dateStr = startDate.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
  const timeStr = `${startDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} — ${endDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
  const durationMs = endDate.getTime() - startDate.getTime();
  const hours = durationMs / (1000 * 60 * 60);
  const durationStr = hours % 1 === 0 ? `${hours} h` : `${hours} h`;
  return { dateStr, timeStr, durationStr };
}

function ReservationCard({
  reservation,
  onWithdraw,
  isWithdrawing,
}: {
  reservation: Reservation;
  onWithdraw: (id: string) => void;
  isWithdrawing: boolean;
}) {
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const { dateStr, timeStr, durationStr } = formatDateTime(
    reservation.start_time,
    reservation.end_time,
  );
  const photo = reservation.room?.photos?.[0] ?? "";

  return (
    <article className="card-interactive flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
      <Link
        to={`/rooms/${reservation.room?.slug}`}
        className="h-24 w-full shrink-0 overflow-hidden rounded-sm sm:h-20 sm:w-32"
      >
        {photo ? (
          <img src={photo} alt={reservation.room?.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <span className="text-foreground/40 text-sm">Sin foto</span>
          </div>
        )}
      </Link>

      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-[17px] tracking-tight">{reservation.room?.name ?? "Sala"}</h3>
          <StatusBadge status={reservation.status} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-foreground/70">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {dateStr}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {timeStr} · {durationStr}
          </span>
          {reservation.band_name && (
            <span className="inline-flex items-center gap-1.5">
              <Music2 className="h-4 w-4" />
              {reservation.band_name}
            </span>
          )}
          {reservation.items && reservation.items.length > 0 && (
            <span>· {reservation.items.length} extras</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {reservation.status === "pending" && (
          <AlertDialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                disabled={isWithdrawing}
              >
                Retirar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Retirar solicitud</AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Estás seguro de que quieres retirar esta solicitud de reserva? Esta acción no se
                  puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    onWithdraw(reservation.id);
                    setShowWithdrawDialog(false);
                  }}
                >
                  Retirar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        {reservation.status === "confirmed" && (
          <Button variant="outline" size="sm" disabled>
            Cancelar
          </Button>
        )}
        <Button asChild variant="ghost" size="icon">
          <Link to={`/app/reservations/${reservation.id}`} aria-label="Ver detalle" />
        </Button>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="card-interactive flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
      <Skeleton className="h-24 w-full rounded-sm sm:h-20 sm:w-32" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-9 w-20 rounded-sm" />
    </div>
  );
}

const MyReservations = () => {
  const [filter, setFilter] = useState<ReservationStatus | "all">("all");
  const { reservations, isLoading, error, refetch } = useReservations();

  const { withdraw, isLoading: isWithdrawing } = useWithdrawReservation(() => {
    refetch();
  });

  const filtered =
    filter === "all" ? reservations : reservations.filter((r) => r.status === filter);

  return (
    <AppShell role="user">
      <section className="border-b border-border gradient-warm">
        <div className="container-app py-14">
          <p className="eyebrow">— Tu actividad</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="display-hero">Mis reservas</h1>
              <p className="mt-3 max-w-lg text-[15px] text-foreground/70">
                Gestiona tus sesiones, revisa el estado y cancela si lo necesitas.
              </p>
            </div>
            <Button asChild variant="cta" size="lg">
              <Link to="/rooms">Reservar nueva sala</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container-app py-10">
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f, i) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-sm border px-3 py-1.5 text-sm transition-colors",
                filter === f.key
                  ? "border-foreground bg-foreground text-background"
                  : "border-foreground/15 text-foreground/70 hover:border-foreground/30 hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="mt-8 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="mt-8 text-center">
            <p className="text-foreground/60">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-foreground/60">No tienes reservas</p>
            <Button asChild variant="cta" size="lg" className="mt-4">
              <Link to="/rooms">Reservar una sala</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {filtered.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                onWithdraw={withdraw}
                isWithdrawing={isWithdrawing}
              />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
};

export default MyReservations;