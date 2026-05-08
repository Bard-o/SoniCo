import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useRooms } from "@/hooks/useRooms";
import { cn } from "@/lib/utils";

const OwnerRooms = () => {
  const { rooms, isLoading, error, refetch, update, remove } = useRooms();

  const toggleActive = async (room: { id: string; slug: string; is_active: boolean; name: string }) => {
    await update(room.id, { is_active: !room.is_active });
  };

  const handleRemove = async (id: string) => {
    await remove(id);
  };

  return (
    <AppShell role="owner">
      <section className="border-b border-border gradient-warm">
        <div className="container-app flex flex-wrap items-end justify-between gap-6 py-12">
          <div>
            <p className="eyebrow">— Gestión</p>
            <h1 className="display-hero mt-4">Salas</h1>
            <p className="mt-4 max-w-xl text-[15px] text-foreground/70">
              Administra tu catálogo de salas: edita información, fotos, equipo enlazado y bloques de mantenimiento.
            </p>
          </div>
          <Button asChild variant="cta" size="lg" className="gap-2">
            <Link to="/owner/rooms/new">
              <Plus className="h-4 w-4" /> Añadir sala
            </Link>
          </Button>
        </div>
      </section>

      <section className="container-app py-12">
        {error && (
          <div className="mb-6 flex items-center justify-between rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={refetch}>Reintentar</Button>
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-surface overflow-hidden bg-card">
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 w-9" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="card-surface mt-6 bg-card p-16 text-center">
            <p className="text-foreground/60">Aún no tienes salas. Crea la primera para empezar.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((r) => (
              <article key={r.id} className="card-surface overflow-hidden bg-card">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {r.photos && r.photos[0] ? (
                    <img src={r.photos[0]} alt={r.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-foreground/30 text-sm">Sin foto</div>
                  )}
                  <span
                    className={cn(
                      "absolute left-3 top-3 inline-flex items-center rounded-sm px-2 py-1 text-[10px] font-medium uppercase tracking-wider",
                      r.is_active ? "bg-success-soft text-foreground" : "bg-muted text-foreground/60"
                    )}
                  >
                    {r.is_active ? "Activa" : "Inactiva"}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg tracking-tight">{r.name}</h3>
                      <p className="mt-1 text-sm text-foreground/65">
                        ${r.price_per_half_hour} / 30 min
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Switch checked={r.is_active} onCheckedChange={() => toggleActive(r)} />
                      <span className="text-[10px] uppercase tracking-wider text-foreground/55">
                        {r.is_active ? "Activa" : "Off"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1 gap-1.5">
                      <Link to={`/owner/rooms/${r.slug}/edit`}>
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar "{r.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Las reservas confirmadas existentes no se verán afectadas.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemove(r.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
};

export default OwnerRooms;
