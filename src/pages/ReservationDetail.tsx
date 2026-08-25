import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Music2 } from "lucide-react";
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
import { useReservation } from "@/hooks/useReservation";
import { useWithdrawReservation } from "@/hooks/useWithdrawReservation";
import { useCancelReservation } from "@/hooks/useCancelReservation";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function formatDateTime(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const dateStr = startDate.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = `${startDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} — ${endDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
  const durationMs = endDate.getTime() - startDate.getTime();
  const hours = durationMs / (1000 * 60 * 60);
  const durationStr = hours % 1 === 0 ? `${hours} h` : `${hours} h`;
  return { dateStr, timeStr, durationStr };
}

function PriceBreakdownCard({
  reservation,
}: {
  reservation: NonNullable<ReturnType<typeof useReservation>["reservation"]>;
}) {
  const { dateStr, timeStr, durationStr } = formatDateTime(
    reservation.start_time,
    reservation.end_time,
  );

  const startDate = new Date(reservation.start_time);
  const endDate = new Date(reservation.end_time);
  const halfHours = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 30));
  const roomPrice = halfHours * (reservation.room?.price_per_half_hour ?? 0);
  const total = Number(reservation.total_price);

  return (
    <div className="card-surface overflow-hidden p-0">
      <div className="bg-secondary/40 px-6 py-4">
        <h2 className="sub-heading">Precio desglosado</h2>
      </div>
      <div className="p-6">
        <Table>
          <TableHeader>
            <TableRow className="border-foreground/10">
              <TableHead className="text-foreground/70">Concepto</TableHead>
              <TableHead className="text-right text-foreground/70">Cantidad</TableHead>
              <TableHead className="text-right text-foreground/70">Precio unit.</TableHead>
              <TableHead className="text-right text-foreground/70">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="border-foreground/10">
              <TableCell>
                <div>
                  <p className="font-medium">{reservation.room?.name ?? "Sala"}</p>
                  <p className="text-xs text-foreground/60">
                    {dateStr} · {timeStr} · {durationStr}
                  </p>
                </div>
              </TableCell>
              <TableCell className="text-right">{halfHours}</TableCell>
              <TableCell className="text-right">
                ${reservation.room?.price_per_half_hour ?? 0}/30 min
              </TableCell>
              <TableCell className="text-right">${roomPrice.toFixed(2)}</TableCell>
            </TableRow>
            {(reservation.items ?? []).map((item) => (
              <TableRow key={item.id} className="border-foreground/10">
                <TableCell>
                  <div>
                    <p className="font-medium">{item.item?.name ?? "Adicional"}</p>
                    <p className="text-xs text-foreground/60">Extra</p>
                  </div>
                </TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">${Number(item.unit_price).toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  ${(item.quantity * Number(item.unit_price)).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} className="font-semibold">
                Total
              </TableCell>
              <TableCell className="text-right font-semibold">${total.toFixed(2)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

const ReservationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { reservation, isLoading, error, refetch } = useReservation(id ?? "");
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { withdraw, isWithdrawing } = useWithdrawReservation(() => {
    refetch();
  });

  const { cancelReservation, isProcessing: isCancelling } = useCancelReservation();

  const handleCancel = async () => {
    if (!reservation) return;
    const result = await cancelReservation(reservation.id);
    if (result.success) {
      toast.success("Reserva cancelada");
      setShowCancelDialog(false);
      refetch();
    } else {
      toast.error(result.error ?? "Error al cancelar la reserva");
    }
  };

  if (isLoading) {
    return (
      <AppShell role="user">
        <div className="container-app py-8">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="container-app py-12">
          <Skeleton className="aspect-[16/10] w-full max-w-2xl" />
        </div>
      </AppShell>
    );
  }

  if (error || !reservation) {
    return (
      <AppShell role="user">
        <div className="container-app py-8">
          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Volver a Mis reservas
          </Link>
        </div>
        <div className="container-app py-16 text-center">
          <p className="text-foreground/60">Reserva no encontrada.</p>
          <Button asChild className="mt-4" variant="cta">
            <Link to="/app">Ver mis solicitudes</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const photo = reservation.room?.photos?.[0] ?? "";
  const { dateStr, timeStr, durationStr } = formatDateTime(
    reservation.start_time,
    reservation.end_time,
  );

  return (
    <AppShell role="user">
      <div className="border-b border-border gradient-warm">
        <div className="container-app py-8">
          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Volver a Mis reservas
          </Link>
        </div>
      </div>

      <div className="container-app py-12">
        {/* Hero: room name + photo */}
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start">
          {photo ? (
            <div className="overflow-hidden rounded-sm shadow-warm sm:w-64 sm:shrink-0">
              <img
                src={photo}
                alt={reservation.room?.name}
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-40 w-full items-center justify-center rounded-sm bg-muted sm:w-64 sm:shrink-0">
              <span className="text-foreground/40 text-sm">Sin foto</span>
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/rooms/${reservation.room?.slug}`}
                className="hover:underline"
              >
                <h1 className="section-heading">{reservation.room?.name ?? "Sala"}</h1>
              </Link>
              <StatusBadge status={reservation.status} />
            </div>
            <div className="mt-4 flex flex-col gap-2 text-sm text-foreground/70">
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {dateStr}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {timeStr} · {durationStr}
              </span>
              {reservation.band_name && (
                <span className="inline-flex items-center gap-2">
                  <Music2 className="h-4 w-4" />
                  {reservation.band_name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-10 flex flex-wrap gap-3">
          {reservation.status === "pending" && (
            <AlertDialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10"
                  disabled={isWithdrawing}
                >
                  Retirar solicitud
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Retirar solicitud</AlertDialogTitle>
                  <AlertDialogDescription>
                    ¿Estás seguro de que quieres retirar esta solicitud de reserva? Esta acción no
                    se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => {
                      withdraw(reservation.id);
                      setShowWithdrawDialog(false);
                      refetch();
                    }}
                  >
                    Retirar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {reservation.status === "confirmed" && (
            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10"
                >
                  Cancelar reserva
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar reserva</AlertDialogTitle>
                  <AlertDialogDescription>
                    ¿Estás seguro de que quieres cancelar esta reserva? Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>No, mantenerla</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleCancel}
                    disabled={isCancelling}
                  >
                    {isCancelling ? "Cancelando..." : "Sí, cancelar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Price breakdown */}
        <div className="mb-10">
          <PriceBreakdownCard reservation={reservation} />
        </div>

        {/* Owner message placeholder */}
        <div className="card-surface p-6">
          <p className="text-sm text-foreground/60">
            (El propietario incluirá un mensaje al aprobar o denegar)
          </p>
        </div>
      </div>
    </AppShell>
  );
};

export default ReservationDetail;