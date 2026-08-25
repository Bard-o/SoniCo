import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Calendar, Headphones, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { RoomCard } from "@/components/RoomCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useRooms } from "@/hooks/useRooms";
import heroImg from "@/assets/hero.jpg";

const features = [
  { icon: Calendar, title: "Reserva en 30 segundos", desc: "Disponibilidad en tiempo real, slots de 30 minutos." },
  { icon: Headphones, title: "Equipo profesional", desc: "Amps, baterías y micros listos para tocar." },
  { icon: ShieldCheck, title: "Pago en estudio", desc: "Sin pagos online. Confirma y aparece." },
];

const Index = () => {
  const { rooms, isLoading } = useRooms();
  const activeRooms = rooms.filter((r) => r.is_active);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden gradient-warm">
        <div className="container-app grid gap-12 py-20 md:grid-cols-12 md:gap-10 md:py-28 lg:py-32">
          <div className="md:col-span-7">
            <span className="eyebrow">— Reserva online 24/7</span>
            <h1 className="display-hero mt-6">
              Tu sala de ensayo,
              <br />
              <span className="text-primary">lista cuando lo</span>
              <br />
              <span className="text-primary">estás tú.</span>
            </h1>
            <p className="mt-8 max-w-xl text-[17px] leading-relaxed text-foreground/75">
              Reserva salas de ensayo y alquila equipo profesional sin llamadas, sin esperas. Solo música.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="cta">
                <Link to="/rooms">
                  Explorar salas <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/equipment">Alquilar equipo</Link>
              </Button>
            </div>

            <dl className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-foreground/10 pt-8">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-foreground/55">Salas</dt>
                <dd className="mt-2 text-[36px] leading-none tracking-tight">{isLoading ? "—" : activeRooms.length}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-foreground/55">Disponibilidad</dt>
                <dd className="mt-2 text-[36px] leading-none tracking-tight">24/7</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-foreground/55">Desde</dt>
                <dd className="mt-2 text-[36px] leading-none tracking-tight">
                  {isLoading ? "—" : activeRooms.length > 0 ? `$${Math.min(...activeRooms.map((r) => r.price_per_half_hour))}` : "—"}
                  <span className="text-sm text-foreground/55">/30m</span>
                </dd>
              </div>
            </dl>
          </div>

          <div className="md:col-span-5">
            <div className="relative">
              <div className="absolute -inset-4 gradient-block opacity-30 blur-3xl" aria-hidden />
              <div className="relative overflow-hidden rounded-sm shadow-warm">
                <img
                  src={heroImg}
                  alt="Músico tocando guitarra eléctrica en sala de ensayo"
                  width={1280}
                  height={1600}
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-5 -left-5 hidden rounded-sm bg-foreground p-4 text-background sm:block">
                <p className="text-[10px] uppercase tracking-wider text-background/60">Próxima disponibilidad</p>
                <p className="mt-1 text-base">Hoy · 18:30</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-y border-border bg-cream">
        <div className="container-app py-20">
          <div className="grid gap-12 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title}>
                <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-foreground text-background">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-6 text-[24px] leading-tight tracking-tight">{f.title}</h3>
                <p className="mt-2 text-[15px] text-foreground/70">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROOMS */}
      <section className="py-24 lg:py-28">
        <div className="container-app">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">— Salas</p>
              <h2 className="section-heading mt-4 max-w-2xl">
                Espacios pensados para músicos.
              </h2>
            </div>
            <Button asChild variant="ghost">
              <Link to="/rooms">
                Ver todas <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="card-surface overflow-hidden bg-card">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <div className="p-5 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))
            ) : activeRooms.length === 0 ? (
              <div className="col-span-full py-16 text-center">
                <p className="text-foreground/60">No hay salas activas en este momento.</p>
              </div>
            ) : (
              activeRooms.map((r) => (
                <RoomCard key={r.id} room={r} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-foreground text-background">
        <div className="absolute inset-x-0 top-0 h-2 gradient-block" aria-hidden />
        <div className="container-app py-24 text-center">
          <h2 className="section-heading mx-auto max-w-3xl">
            Listo para tu próxima sesión.
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-[17px] text-background/70">
            Crea tu cuenta gratis y reserva tu primera hora de ensayo en menos de un minuto.
          </p>
          <div className="mt-10 flex justify-center gap-3">
            <Button size="lg" variant="cta" className="bg-primary text-primary-foreground hover:bg-flame">
              Crear cuenta
            </Button>
            <Button asChild size="lg" variant="ghost" className="text-background hover:bg-background/10">
              <Link to="/rooms">Ver salas</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Index;
