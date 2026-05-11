import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { RoomCard } from "@/components/RoomCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useRooms } from "@/hooks/useRooms";

const Rooms = () => {
  const { rooms, isLoading } = useRooms();
  const activeRooms = rooms.filter((r) => r.is_active);

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
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card-surface overflow-hidden bg-card">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <div className="p-5 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : activeRooms.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-foreground/60">No hay salas activas en este momento. ¡Vuelve pronto!</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {activeRooms.map((r) => (
                <RoomCard key={r.id} room={r} />
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Rooms;
