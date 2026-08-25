import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOwnerPendingReservations } from "@/hooks/useOwnerPendingReservations";
import { useOwnerPendingRentals } from "@/hooks/useOwnerPendingRentals";
import { useApproveReservation } from "@/hooks/useApproveReservation";
import { useDenyReservation } from "@/hooks/useDenyReservation";
import { useApproveRental } from "@/hooks/useApproveRental";
import { useDenyRental } from "@/hooks/useDenyRental";
import { cn } from "@/lib/utils";

type TabValue = "all" | "rooms" | "rentals";

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
  reservationData?: PendingReservation;
  rentalData?: PendingRental;
}

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

function makeReservationItem(r: PendingReservation): PendingItem {
  const startDate = new Date(r.start_time);
  const endDate = new Date(r.end_time);
  const dateStr = startDate.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeStr = `${startDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} — ${endDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
  return {
    id: r.id,
    type: "reservation",
    userName: r.profiles?.full_name ?? "Usuario desconocido",
    title: r.rooms?.name ?? "Sala",
    dateStr,
    timeStr,
    extra: r.band_name ?? "",
    created_at: r.created_at,
    reservationData: r,
  };
}

function makeRentalItem(r: PendingRental): PendingItem {
  const startDate = new Date(r.start_datetime);
  const endDate = new Date(r.end_datetime);
  const dateStr = startDate.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeStr = `${startDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} — ${endDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
  return {
    id: r.id,
    type: "rental",
    userName: r.profiles?.full_name ?? "Usuario desconocido",
    title: "Alquiler de equipos",
    dateStr,
    timeStr,
    extra: r.band_or_event_name ?? "",
    created_at: r.created_at,
    rentalData: r,
  };
}

// --- Conflict Modal ---

interface ConflictModalProps {
  conflictCount: number;
  crossConflictCount: number;
  crossConflictType?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConflictModal({ conflictCount, crossConflictCount, crossConflictType, onConfirm, onCancel }: ConflictModalProps) {
  const crossLabel = crossConflictType === "rental" ? "alquileres" : "reservas";
  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar aprobación</DialogTitle>
        </DialogHeader>
        {conflictCount > 0 && (
          <p className="text-sm text-foreground/70">
            Aprobar esta solicitud denegará automáticamente{" "}
            <strong>{conflictCount} solicitud{conflictCount > 1 ? "es" : ""}</strong>{" "}
            pendiente{conflictCount > 1 ? "s" : ""} para el mismo horario.
          </p>
        )}
        {crossConflictCount > 0 && (
          <p className="mt-2 text-sm text-foreground/70">
            ⚠️ Además, hay{" "}
            <strong>{crossConflictCount} {crossConflictCount > 1 ? crossLabel : crossLabel.slice(0, -1)}</strong>{" "}
            pendiente{crossConflictCount > 1 ? "s" : ""} que usan los mismos equipos en este horario.
            No se denegarán automáticamente, pero podrían quedar bloqueadas.
          </p>
        )}
        <p className="mt-2 text-sm text-foreground/60">¿Deseas continuar?</p>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="cta" onClick={onConfirm}>
            Sí, aprobar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Deny Dialog ---

interface DenyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (message: string) => void;
  isProcessing: boolean;
}

function DenyDialog({ open, onOpenChange, onConfirm, isProcessing }: DenyDialogProps) {
  const [message, setMessage] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Denegar solicitud</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-foreground/70">
          Opcionalmente, puedes incluir un mensaje para el usuario.
        </p>
        <Textarea
          className="mt-3"
          placeholder="Motivo de la denegación (opcional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
        />
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(message)}
            disabled={isProcessing}
          >
            Confirmar denegación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Item Card ---

interface ItemCardProps {
  item: PendingItem;
  onApprove: (id: string, type: "reservation" | "rental") => void;
  onDeny: (id: string, type: "reservation" | "rental") => void;
  approvingId: string | null;
  denyingId: string | null;
  conflictCount: number;
  crossConflictCount: number;
}

function ItemCard({ item, onApprove, onDeny, approvingId, denyingId, conflictCount, crossConflictCount }: ItemCardProps) {
  const isApproving = approvingId === item.id;
  const isDenying = denyingId === item.id;
  const isProcessing = isApproving || isDenying;

  return (
    <div className="card-surface flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium">{item.title}</p>
          {(conflictCount > 0 || crossConflictCount > 0) && (
            <span className="inline-flex items-center gap-1 rounded-sm bg-destructive/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-destructive">
              ⚠ Conflicto
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-foreground/70">
          {item.dateStr} · {item.timeStr}
        </p>
        {item.extra && (
          <p className="mt-1 text-xs text-foreground/50">
            {item.type === "reservation" ? "Banda" : "Evento"}: {item.extra}
          </p>
        )}
        <p className="mt-1 text-xs text-foreground/50">
          Usuario: {item.userName} · Enviado {formatRelativeTime(item.created_at)}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:bg-destructive/10"
          onClick={() => onDeny(item.id, item.type)}
          disabled={isProcessing}
        >
          {isDenying ? "Denegando..." : "Denegar"}
        </Button>
        <Button
          variant="cta"
          size="sm"
          onClick={() => onApprove(item.id, item.type)}
          disabled={isProcessing}
        >
          {isApproving ? "Aprobando..." : "Aprobar"}
        </Button>
      </div>
    </div>
  );
}

// --- Main Component ---

const OwnerPending = () => {
  const { pending, isLoading: resLoading, error: resError, refetch: refetchRes } = useOwnerPendingReservations();
  const { pendingRentals, isLoading: rentLoading, error: rentError, refetch: refetchRent } = useOwnerPendingRentals();

  const { approveReservation, isProcessing: aprProcessing } = useApproveReservation();
  const { denyReservation, isProcessing: denProcessing } = useDenyReservation();
  const { approveRental, isProcessing: aprRentProcessing } = useApproveRental();
  const { denyRental, isProcessing: denRentProcessing } = useDenyRental();

  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [conflictModal, setConflictModal] = useState<{
    id: string;
    type: "reservation" | "rental";
    count: number;
    crossCount: number;
    crossType?: string;
  } | null>(null);
  const [denyDialog, setDenyDialog] = useState<{
    id: string;
    type: "reservation" | "rental";
  } | null>(null);
  const [conflictMap, setConflictMap] = useState<Record<string, { count: number; crossCount: number }>>({});
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [denyingId, setDenyingId] = useState<string | null>(null);


  const isLoading = resLoading || rentLoading;
  const hasError = resError || rentError;
  const refetch = () => { refetchRes(); refetchRent(); };

  // Track if we've already run conflict checks for the current data
  const checkedRef = useRef(false);

  // Auto-run conflict checks when pending data loads
  useEffect(() => {
    if (isLoading) return;
    if (pending === undefined && pendingRentals === undefined) return;

    const runChecks = async () => {
      const map: Record<string, { count: number; crossCount: number }> = {};

      const reservationChecks = (pending ?? []).map(async (r) => {
        const result = await approveReservation(r.id, undefined, false);
        if (result.success) {
          const c = result.data?.conflicts ?? 0;
          const cc = result.data?.cross_conflicts ?? 0;
          if (c > 0 || cc > 0) map[r.id] = { count: c, crossCount: cc };
        }
      });

      const rentalChecks = (pendingRentals ?? []).map(async (r) => {
        const result = await approveRental(r.id, undefined, false);
        if (result.success) {
          const c = result.data?.conflicts ?? 0;
          const cc = result.data?.cross_conflicts ?? 0;
          if (c > 0 || cc > 0) map[r.id] = { count: c, crossCount: cc };
        }
      });

      await Promise.allSettled([...reservationChecks, ...rentalChecks]);
      setConflictMap(map);
      checkedRef.current = true;
    };

    runChecks();
  }, [pending, pendingRentals, isLoading]);

  // Build combined list
  const allItems: PendingItem[] = [
    ...(pending ?? []).map(makeReservationItem),
    ...(pendingRentals ?? []).map(makeRentalItem),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const totalCount = allItems.length;
  const roomsItems = allItems.filter((i) => i.type === "reservation");
  const rentalsItems = allItems.filter((i) => i.type === "rental");

  // Approve handler
  const handleApprove = async (id: string, type: "reservation" | "rental") => {
    setApprovingId(id);
    try {
      const result =
        type === "reservation"
          ? await approveReservation(id)
          : await approveRental(id);

      if (!result.success) {
        toast.error(result.error ?? "Error al aprobar la solicitud");
        return;
      }

      const conflicts = result.data?.conflicts ?? 0;
      const crossConflicts = result.data?.cross_conflicts ?? 0;
      const crossType = result.data?.cross_conflict_type as string | undefined;

      // Store conflicts for inline badge
      if (conflicts > 0 || crossConflicts > 0) {
        setConflictMap((prev) => ({ ...prev, [id]: { count: conflicts, crossCount: crossConflicts } }));
      } else {
        setConflictMap((prev) => { const next = { ...prev }; delete next[id]; return next; });
      }

      if (conflicts > 0 || crossConflicts > 0) {
        setConflictModal({ id, type, count: conflicts, crossCount: crossConflicts, crossType });
        return;
      }

      // No conflicts — proceed with Phase 2 (confirm = true)
      const confirmResult =
        type === "reservation"
          ? await approveReservation(id, undefined, true)
          : await approveRental(id, undefined, true);

      if (!confirmResult.success) {
        toast.error(confirmResult.error ?? "Error al aprobar la solicitud");
        return;
      }

      toast.success("Solicitud aprobada correctamente");
      refetch();
    } finally {
      setApprovingId(null);
    }
  };

  // Confirm approve after conflict modal
  const handleConfirmApprove = async () => {
    if (!conflictModal) return;
    const { id, type } = conflictModal;
    setConflictModal(null);
    setApprovingId(id);

    try {
      const result =
        type === "reservation"
          ? await approveReservation(id, undefined, true)
          : await approveRental(id, undefined, true);

      if (!result.success) {
        toast.error(result.error ?? "Error al aprobar la solicitud");
        return;
      }

      toast.success("Solicitud aprobada correctamente");
      refetch();
    } finally {
      setApprovingId(null);
    }
  };

  // Deny handler — opens dialog
  const handleDeny = (_id: string, type: "reservation" | "rental") => {
    setDenyDialog({ id: _id, type });
  };

  // Confirm deny after dialog
  const handleConfirmDeny = async (message: string) => {
    if (!denyDialog) return;
    const { id, type } = denyDialog;
    setDenyDialog(null);
    setDenyingId(id);

    try {
      const result =
        type === "reservation"
          ? await denyReservation(id, message || undefined)
          : await denyRental(id, message || undefined);

      if (!result.success) {
        toast.error(result.error ?? "Error al denegar la solicitud");
        return;
      }

      toast.success("Solicitud denegada");
      refetch();
    } finally {
      setDenyingId(null);
    }
  };

  const isProcessing = aprProcessing || denProcessing || aprRentProcessing || denRentProcessing;

  return (
    <AppShell role="owner">
      {/* Hero */}
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
                Revisa las solicitudes de reserva y alquiler pendientes y apruébalas o denegarlas.
              </p>
            </div>
            <span
              className={cn(
                "inline-flex items-center rounded-sm px-3 py-1.5 text-sm font-medium",
                totalCount > 0
                  ? "bg-warning-soft text-foreground"
                  : "bg-muted text-foreground/60",
              )}
            >
              {totalCount} pendiente{totalCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </section>

      {/* Tabs + Content */}
      <section className="container-app py-12">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">Todas ({totalCount})</TabsTrigger>
            <TabsTrigger value="rooms">Salas ({roomsItems.length})</TabsTrigger>
            <TabsTrigger value="rentals">Alquileres ({rentalsItems.length})</TabsTrigger>
          </TabsList>

          {/* Loading */}
          {isLoading && (
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
          )}

          {/* Error */}
          {!isLoading && hasError && (
            <div className="text-center">
              <p className="text-foreground/60">{resError ?? rentError}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={refetch}>
                Reintentar
              </Button>
            </div>
          )}

          {/* Todas tab */}
          <TabsContent value="all" className="mt-0">
            {!isLoading && !hasError && allItems.length === 0 && (
              <div className="text-center">
                <p className="text-foreground/60">No hay solicitudes pendientes de ningún tipo.</p>
              </div>
            )}
            {!isLoading && !hasError && allItems.length > 0 && (
              <div className="space-y-4">
                {allItems.map((item) => (
                  <ItemCard
                    key={`${item.type}-${item.id}`}
                    item={item}
                    onApprove={handleApprove}
                    onDeny={handleDeny}
                    approvingId={approvingId}
                    denyingId={denyingId}
                    conflictCount={conflictMap[item.id]?.count ?? 0}
                    crossConflictCount={conflictMap[item.id]?.crossCount ?? 0}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Salas tab */}
          <TabsContent value="rooms" className="mt-0">
            {!isLoading && !hasError && roomsItems.length === 0 && (
              <div className="text-center">
                <p className="text-foreground/60">No hay solicitudes pendientes de salas.</p>
              </div>
            )}
            {!isLoading && !hasError && roomsItems.length > 0 && (
              <div className="space-y-4">
                {roomsItems.map((item) => (
                  <ItemCard
                    key={`${item.type}-${item.id}`}
                    item={item}
                    onApprove={handleApprove}
                    onDeny={handleDeny}
                    approvingId={approvingId}
                    denyingId={denyingId}
                    conflictCount={conflictMap[item.id]?.count ?? 0}
                    crossConflictCount={conflictMap[item.id]?.crossCount ?? 0}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Alquileres tab */}
          <TabsContent value="rentals" className="mt-0">
            {!isLoading && !hasError && rentalsItems.length === 0 && (
              <div className="text-center">
                <p className="text-foreground/60">No hay solicitudes pendientes de alquileres.</p>
              </div>
            )}
            {!isLoading && !hasError && rentalsItems.length > 0 && (
              <div className="space-y-4">
                {rentalsItems.map((item) => (
                  <ItemCard
                    key={`${item.type}-${item.id}`}
                    item={item}
                    onApprove={handleApprove}
                    onDeny={handleDeny}
                    approvingId={approvingId}
                    denyingId={denyingId}
                    conflictCount={conflictMap[item.id]?.count ?? 0}
                    crossConflictCount={conflictMap[item.id]?.crossCount ?? 0}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>

      {/* Conflict Modal */}
      {conflictModal && (
        <ConflictModal
          conflictCount={conflictModal.count}
          crossConflictCount={conflictModal.crossCount}
          crossConflictType={conflictModal.crossType}
          onConfirm={handleConfirmApprove}
          onCancel={() => setConflictModal(null)}
        />
      )}

      {/* Deny Dialog */}
      <DenyDialog
        open={denyDialog !== null}
        onOpenChange={(open) => !open && setDenyDialog(null)}
        onConfirm={handleConfirmDeny}
        isProcessing={isProcessing}
      />
    </AppShell>
  );
};

export default OwnerPending;