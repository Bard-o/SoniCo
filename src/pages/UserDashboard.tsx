import { Link } from "react-router-dom";
import { Calendar, Clock, MoreHorizontal, Music2 } from "lucide-react";
import { AppShell, StatusBadge } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { rooms } from "@/data/rooms";
import { cn } from "@/lib/utils";

type Status = "pending" | "confirmed" | "denied" | "cancelled";

const reservations: {
  id: string;
  room: typeof rooms[number];
  date: string;
  time: string;
  duration: string;
  band?: string;
  addons: number;
  status: Status;
}[] = [
  { id: "r1", room: rooms[0], date: "Jue 7 May", time: "18:00 — 20:00", duration: "2 h", band: "Echo Drift", addons: 2, status: "confirmed" },
  { id: "r2", room: rooms[1], date: "Sáb 9 May", time: "10:00 — 11:30", duration: "1.5 h", band: "Mar de Estática", addons: 0, status: "pending" },
  { id: "r3", room: rooms[2], date: "Lun 4 May", time: "16:00 — 17:00", duration: "1 h", addons: 1, status: "denied" },
  { id: "r4", room: rooms[0], date: "Mié 29 Abr", time: "20:00 — 22:00", duration: "2 h", band: "Echo Drift", addons: 0, status: "cancelled" },
];

const filters: { key: Status | "all"; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "pending", label: "Pendientes" },
  { key: "confirmed", label: "Confirmadas" },
  { key: "denied", label: "Denegadas" },
  { key: "cancelled", label: "Canceladas" },
];

const UserDashboard = () => {
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
              className={cn(
                "rounded-sm border px-3 py-1.5 text-sm transition-colors",
                i === 0
                  ? "border-foreground bg-foreground text-background"
                  : "border-foreground/15 text-foreground/70 hover:border-foreground/30 hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          {reservations.map((r) => (
            <article key={r.id} className="card-interactive flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
              <div className="h-24 w-full shrink-0 overflow-hidden rounded-sm sm:h-20 sm:w-32">
                <img src={r.room.image} alt={r.room.name} className="h-full w-full object-cover" />
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-[17px] tracking-tight">{r.room.name}</h3>
                  <StatusBadge status={r.status} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-foreground/70">
                  <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" />{r.date}</span>
                  <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />{r.time} · {r.duration}</span>
                  {r.band && <span className="inline-flex items-center gap-1.5"><Music2 className="h-4 w-4" />{r.band}</span>}
                  {r.addons > 0 && <span>· {r.addons} extras</span>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {r.status === "pending" && (
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                    Retirar
                  </Button>
                )}
                {r.status === "confirmed" && (
                  <Button variant="outline" size="sm">Cancelar</Button>
                )}
                <Button variant="ghost" size="icon" aria-label="Más acciones">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
};

export default UserDashboard;
