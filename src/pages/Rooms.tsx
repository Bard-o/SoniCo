import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { RoomCard } from "@/components/RoomCard";
import { rooms } from "@/data/rooms";

const Rooms = () => {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="border-b border-border gradient-warm">
        <div className="container-app py-20 lg:py-24">
          <p className="eyebrow">— Catálogo</p>
          <h1 className="display-hero mt-5 max-w-3xl">Salas de ensayo</h1>
          <p className="mt-6 max-w-xl text-[17px] text-foreground/70">
            Reserva por horas — mínimo 1 hora. Slots disponibles cada 30 minutos.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="container-app">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((r) => (
              <RoomCard key={r.slug} room={r} />
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
};

export default Rooms;
