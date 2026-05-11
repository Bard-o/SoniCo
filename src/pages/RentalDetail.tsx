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
import { useRental } from "@/hooks/useRental";
import { useWithdrawRental } from "@/hooks/useWithdrawRental";
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
  const durationStr = hours % 1 === 0 ? `${hours} h` : `${hours.toFixed(1)} h`;
  return { dateStr, timeStr, durationStr };
}

const RentalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { rental, isLoading, error, refetch } = useRental(id ?? "");
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const { withdraw, isWithdrawing, error: withdrawError } = useWithdrawRental();

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

  if (error || !rental) {
    return (
      <AppShell role="user">
        <div className="container-app py-8">
          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Volver a Mis solicitudes
          </Link>
        </div>
        <div className="container-app py-16 text-center">
          <p className="text-foreground/60">Alquiler no encontrado.</p>
          <Button asChild className="mt-4" variant="cta">
            <Link to="/app">Ver mis solicitudes</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const { dateStr, timeStr, durationStr } = formatDateTime(
    rental.start_datetime,
    rental.end_datetime,
  );

  const startDate = new Date(rental.start_datetime);
  const endDate = new Date(rental.end_datetime);
  const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  const itemsTotal = (rental.items ?? []).reduce(
    (sum, item) => sum + item.quantity * Number(item.unit_price),
    0,
  );
  const total = itemsTotal * hours;

  return (
    <AppShell role="user">
      <div className="border-b border-border gradient-warm">
        <div className="container-app py-8">
          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Volver a Mis solicitudes
          </Link>
        </div>
      </div>

      <div className="container-app py-12">
        {/* Hero */}
        <div className="mb-10">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="section-heading">Alquiler de equipo</h1>
            <StatusBadge status={rental.status} type="rental" />
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
            {rental.band_or_event_name && (
              <span className="inline-flex items-center gap-2">
                <Music2 className="h-4 w-4" />
                {rental.band_or_event_name}
              </span>
            )}
            {rental.details && (
              <p className="mt-2 max-w-lg text-[14px] text-foreground/60 italic">
                {rental.details}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mb-10 flex flex-wrap gap-3">
          {rental.status === "pending" && (
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
                    ¿Estás seguro de que quieres retirar esta solicitud de alquiler? Esta acción no
                    se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={async () => {
                      await withdraw(rental.id);
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
          {rental.status === "confirmed" && (
            <Button variant="outline" disabled>
              Cancelar alquiler
            </Button>
          )}
          {withdrawError && (
            <p className="w-full text-sm text-destructive">{withdrawError}</p>
          )}
        </div>

        {/* Price breakdown */}
        <div className="mb-10">
          <div className="card-surface overflow-hidden p-0">
            <div className="bg-secondary/40 px-6 py-4">
              <h2 className="sub-heading">Precio desglosado</h2>
            </div>
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow className="border-foreground/10">
                    <TableHead className="text-foreground/70">Equipo</TableHead>
                    <TableHead className="text-right text-foreground/70">Cantidad</TableHead>
                    <TableHead className="text-right text-foreground/70">Precio/hora</TableHead>
                    <TableHead className="text-right text-foreground/70">Subtotal/hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(rental.items ?? []).map((item) => (
                    <TableRow key={item.id} className="border-foreground/10">
                      <TableCell>
                        <p className="font-medium">{item.item?.name ?? "Equipo"}</p>
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        ${Number(item.unit_price).toLocaleString("es-AR")}
                      </TableCell>
                      <TableCell className="text-right">
                        ${(item.quantity * Number(item.unit_price)).toLocaleString("es-AR")}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={2} />
                    <TableCell className="text-foreground/60 text-sm">Duración</TableCell>
                    <TableCell className="text-right text-foreground/60 text-sm">
                      {hours.toFixed(hours % 1 === 0 ? 0 : 1)} h
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} className="font-semibold">
                      Total estimado
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${total.toLocaleString("es-AR")}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Owner message */}
        {rental.owner_message && (
          <div className="card-surface p-6">
            <p className="text-[11px] uppercase tracking-wider text-foreground/55">
              Mensaje del propietario
            </p>
            <p className="mt-2 text-[15px]">{rental.owner_message}</p>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default RentalDetail;
