import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import { useReservations } from "@/hooks/useReservations";
import type { ReservationWithRoom } from "@/hooks/useReservations";
import { useRentals } from "@/hooks/useRentals";
import type { RentalWithItems } from "@/hooks/useRentals";
import { useWithdrawReservation } from "@/hooks/useWithdrawReservation";
import { useWithdrawRental } from "@/hooks/useWithdrawRental";
import { cn } from "@/lib/utils";

type ActivityType = "all" | "reservation" | "rental";
type StatusFilter = "all" | "pending" | "confirmed" | "denied" | "cancelled";

type ActivityItem =
  | { kind: "reservation"; data: ReservationWithRoom }
  | { kind: "rental"; data: RentalWithItems };

const typeFilters: { key: ActivityType; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "reservation", label: "Reservas" },
  { key: "rental", label: "Alquileres" },
];

const statusFilters: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Pendientes" },
  { key: "confirmed", label: "Confirmados" },
  { key: "denied", label: "Denegados" },
  { key: "cancelled", label: "Cancelados" },
];

function formatDate(start: string) {
  const d = new Date(start);
  return d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
}

function formatTime(start: string, end: string) {
  const sd = new Date(start);
  const ed = new Date(end);
  return `${sd.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} — ${ed.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
}

function formatDuration(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const h = ms / (1000 * 60 * 60);
  return h % 1 === 0 ? `${h} h` : `${h.toFixed(1)} h`;
}

function getStartTime(item: ActivityItem): string {
  return item.kind === "reservation" ? item.data.start_time : item.data.start_datetime;
}

function ActivityCard({
  item,
  onWithdrawReservation,
  onWithdrawRental,
  isWithdrawing,
}: {
  item: ActivityItem;
  onWithdrawReservation: (id: string) => void;
  onWithdrawRental: (id: string) => void;
  isWithdrawing: boolean;
}) {
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);

  if (item.kind === "reservation") {
    const r = item.data;
    const photo = r.room?.photos?.[0] ?? "";
    const detailPath = `/app/reservations/${r.id}`;

    return (
      <article className="card-interactive flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <Link to={detailPath} className="flex-1">
          <div className="flex items-start gap-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-sm sm:h-16 sm:w-24">
              {photo ? (
                <img src={photo} alt={r.room?.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <span className="text-foreground/40 text-xs">Sin foto</span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-sm bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-800">
                  Reserva
                </span>
                <h3 className="truncate text-[15px] font-medium">{r.room?.name ?? "Sala"}</h3>
                <StatusBadge status={r.status} />
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-foreground/60">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(r.start_time)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatTime(r.start_time, r.end_time)} · {formatDuration(r.start_time, r.end_time)}
                </span>
                {r.band_name && (
                  <span className="inline-flex items-center gap-1">
                    <Music2 className="h-3.5 w-3.5" />
                    {r.band_name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
        <div className="flex shrink-0 items-center gap-2 sm:flex-col">
          {r.status === "pending" && (
            <AlertDialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" disabled={isWithdrawing}>
                  Retirar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Retirar solicitud</AlertDialogTitle>
                  <AlertDialogDescription>
                    ¿Estás seguro de que quieres retirar esta solicitud de reserva?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => { onWithdrawReservation(r.id); setShowWithdrawDialog(false); }}
                  >
                    Retirar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {r.status === "confirmed" && (
            <Button variant="outline" size="sm" disabled>Cancelar</Button>
          )}
          <Button asChild variant="ghost" size="sm">
            <Link to={detailPath}>Ver →</Link>
          </Button>
        </div>
      </article>
    );
  }

  // Rental card
  const rental = item.data;
  const firstItem = rental.items?.[0]?.item?.name ?? "Equipo";
  const extraCount = (rental.items?.length ?? 1) - 1;
  const title = extraCount > 0 ? `${firstItem} y ${extraCount} más` : firstItem;
  const detailPath = `/app/rentals/${rental.id}`;

  return (
    <article className="card-interactive flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      <Link to={detailPath} className="flex-1">
        <div className="flex items-start gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-sm bg-cream sm:h-16 sm:w-24">
            <span className="block h-8 w-8 gradient-block" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-sm bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-blue-800">
                Alquiler
              </span>
              <h3 className="truncate text-[15px] font-medium">{title}</h3>
              <StatusBadge status={rental.status} type="rental" />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-foreground/60">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(rental.start_datetime)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(rental.start_datetime, rental.end_datetime)} · {formatDuration(rental.start_datetime, rental.end_datetime)}
              </span>
              {rental.band_or_event_name && (
                <span className="inline-flex items-center gap-1">
                  <Music2 className="h-3.5 w-3.5" />
                  {rental.band_or_event_name}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-2 sm:flex-col">
        {rental.status === "pending" && (
          <AlertDialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" disabled={isWithdrawing}>
                Retirar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Retirar solicitud</AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Estás seguro de que quieres retirar esta solicitud de alquiler?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => { onWithdrawRental(rental.id); setShowWithdrawDialog(false); }}
                >
                  Retirar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        {rental.status === "confirmed" && (
          <Button variant="outline" size="sm" disabled>Cancelar</Button>
        )}
        <Button asChild variant="ghost" size="sm">
          <Link to={detailPath}>Ver →</Link>
        </Button>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="card-interactive flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
      <Skeleton className="h-20 w-full rounded-sm sm:h-16 sm:w-24" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-9 w-16 rounded-sm" />
    </div>
  );
}

const UserDashboard = () => {
  const [typeFilter, setTypeFilter] = useState<ActivityType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const {
    reservations,
    isLoading: rLoading,
    error: rError,
    refetch: refetchR,
  } = useReservations();
  const {
    rentals,
    isLoading: tLoading,
    error: tError,
    refetch: refetchT,
  } = useRentals();

  const { withdraw: withdrawRes, isLoading: withdrawingRes } = useWithdrawReservation(() => {
    refetchR();
  });
  const { withdraw: withdrawRental, isLoading: withdrawingRental } = useWithdrawRental(() => {
    refetchT();
  });

  const merged = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];
    if (reservations) {
      for (const r of reservations) {
        items.push({ kind: "reservation", data: r });
      }
    }
    if (rentals) {
      for (const r of rentals) {
        items.push({ kind: "rental", data: r });
      }
    }
    return items.sort((a, b) => getStartTime(b).localeCompare(getStartTime(a)));
  }, [reservations, rentals]);

  const filtered = useMemo(() => {
    let result = merged;
    if (typeFilter !== "all") {
      result = result.filter((item) => item.kind === typeFilter);
    }
    if (statusFilter !== "all") {
      result = result.filter((item) => item.data.status === statusFilter);
    }
    return result;
  }, [merged, typeFilter, statusFilter]);

  const isLoading = rLoading || tLoading;
  const hasAnyData =
    (reservations && reservations.length > 0) || (rentals && rentals.length > 0);

  return (
    <AppShell role="user">
      {/* Hero */}
      <section className="border-b border-border gradient-warm">
        <div className="container-app py-14">
          <p className="eyebrow">— Tu actividad</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="display-hero">Mis solicitudes</h1>
              <p className="mt-3 max-w-lg text-[15px] text-foreground/70">
                Todas tus reservas de salas y alquileres de equipo en un solo lugar.
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild variant="outline" size="lg">
                <Link to="/rooms">Reservar sala</Link>
              </Button>
              <Button asChild variant="cta" size="lg">
                <Link to="/equipment">Alquilar equipo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="container-app pt-10 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {typeFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setTypeFilter(f.key)}
              className={cn(
                "rounded-sm border px-3 py-1.5 text-xs uppercase tracking-wider transition-colors",
                typeFilter === f.key
                  ? "border-foreground bg-foreground text-background"
                  : "border-foreground/15 text-foreground/70 hover:border-foreground/30 hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
          <span className="mx-2 h-5 w-px bg-border" />
          {statusFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                "rounded-sm border px-3 py-1.5 text-xs uppercase tracking-wider transition-colors",
                statusFilter === f.key
                  ? "border-foreground bg-foreground text-background"
                  : "border-foreground/15 text-foreground/70 hover:border-foreground/30 hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {/* Content */}
      <section className="container-app pb-16">
        {isLoading && !hasAnyData ? (
          <div className="mt-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (rError || tError) && !hasAnyData ? (
          <div className="mt-16 text-center">
            <p className="text-foreground/60">Error al cargar tus solicitudes.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => { refetchR(); refetchT(); }}>
              Reintentar
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-16 text-center">
            {merged.length === 0 ? (
              <>
                <p className="text-foreground/60">No tienes solicitudes todavía.</p>
                <div className="mt-6 flex justify-center gap-3">
                  <Button asChild variant="cta" size="lg">
                    <Link to="/rooms">Reservar una sala</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/equipment">Alquilar equipo</Link>
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-foreground/60">No hay resultados con los filtros seleccionados.</p>
            )}
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filtered.map((item) => (
              <ActivityCard
                key={`${item.kind}-${item.data.id}`}
                item={item}
                onWithdrawReservation={withdrawRes}
                onWithdrawRental={withdrawRental}
                isWithdrawing={withdrawingRes || withdrawingRental}
              />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
};

export default UserDashboard;
