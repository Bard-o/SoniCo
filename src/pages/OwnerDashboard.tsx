import { ArrowUpRight, CalendarCheck, Clock, DoorOpen, Inbox } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";

// Minimal stub — rooms wiring deferred to Iteración 3
const rooms = [
  { name: "Studio A — The Live Room", slug: "studio-a" },
  { name: "Studio B — The Vintage Room", slug: "studio-b" },
  { name: "Studio C — The Composer Suite", slug: "studio-c" },
];

const stats = [
  { label: "Solicitudes pendientes", value: "4", hint: "Requieren tu revisión", icon: Inbox, accent: true },
  { label: "Reservas esta semana", value: "23", hint: "+12% vs. semana pasada", icon: CalendarCheck },
  { label: "Alquileres esta semana", value: "11", hint: "8 confirmados", icon: Clock },
  { label: "Salas activas", value: "3", hint: "1 en mantenimiento", icon: DoorOpen },
];

const pending = [
  { id: "p1", user: "Lucía Martín", target: "Studio A · Jue 7 May 18:00 — 20:00", band: "Echo Drift", time: "hace 2 horas" },
  { id: "p2", user: "Andrés Quintero", target: "Studio B · Sáb 9 May 12:00 — 13:30", band: "Mar de Estática", time: "hace 5 horas" },
  { id: "p3", user: "Paula Iglesias", target: "Alquiler · Marshall JCM800 + 2 micrófonos", band: "—", time: "hace 9 horas" },
];

const today = [
  { id: "t1", time: "10:00 — 11:30", room: rooms[1].name, user: "Daniel Ruiz" },
  { id: "t2", time: "14:00 — 16:00", room: rooms[0].name, user: "Banda Aurora" },
  { id: "t3", time: "18:00 — 20:00", room: rooms[0].name, user: "Echo Drift" },
];

const OwnerDashboard = () => {
  return (
    <AppShell role="owner">
      <section className="border-b border-border gradient-warm">
        <div className="container-app py-14">
          <p className="eyebrow">— Panel del estudio</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <h1 className="display-hero">Hola, María.</h1>
            <p className="text-[15px] text-foreground/70">Martes, 5 de mayo de 2026</p>
          </div>
        </div>
      </section>

      <section className="container-app -mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`card-surface bg-card p-5 ${s.accent ? "shadow-warm-md" : ""}`}
            >
              <div className="flex items-start justify-between">
                <p className="text-xs uppercase tracking-wider text-foreground/60">{s.label}</p>
                <span className={`flex h-8 w-8 items-center justify-center rounded-sm ${s.accent ? "gradient-block text-foreground" : "bg-secondary text-foreground/70"}`}>
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
        <div className="card-surface bg-card p-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="sub-heading">Solicitudes recientes</h2>
              <p className="mt-1 text-sm text-foreground/65">Revisa y aprueba o deniega rápidamente.</p>
            </div>
            <Button variant="ghost" size="sm" className="gap-1">
              Ver todas <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-6 divide-y divide-border">
            {pending.map((p) => (
              <div key={p.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-5">
                <div className="flex-1">
                  <p className="text-sm font-medium">{p.user}</p>
                  <p className="mt-0.5 text-sm text-foreground/70">{p.target}</p>
                  <p className="mt-1 text-xs text-foreground/50">Banda: {p.band} · Enviado {p.time}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                    Denegar
                  </Button>
                  <Button variant="cta" size="sm">Aprobar</Button>
                </div>
              </div>
            ))}
          </div>
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
