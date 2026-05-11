import { Fragment, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Info, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoom } from "@/hooks/useRoom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const slots = ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00"];
const bookedKey = new Set([
  "0-10:00","0-15:00","1-11:00","2-18:00","3-09:00","4-20:00","5-14:00","6-12:00","6-13:00",
]);

import type { Room } from "@/types/database";
import type { User } from "@supabase/supabase-js";
import type { NavigateFunction } from "react-router-dom";

const MobileBookingCard = ({ room, user, navigate }: { room: Room; user: User | null; navigate: NavigateFunction }) => (
  <div className="card-surface overflow-hidden">
    <div className="flex items-center justify-between p-4">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-foreground/55">Precio</p>
        <p className="mt-1 flex items-baseline gap-1">
          <span className="text-2xl leading-none tracking-tight font-light">${room.price_per_half_hour}</span>
          <span className="text-xs text-foreground/60">/ 30 min</span>
        </p>
      </div>
      <Button
        variant="cta"
        disabled={!room.is_active}
        onClick={() => {
          if (!user) navigate("/login");
          else if (room.is_active) navigate(`/rooms/${room.slug}/reserve`);
        }}
      >
        {room.is_active ? (user ? "Reservar" : "Ingresar") : "No disponible"}
      </Button>
    </div>
    <p className="border-t border-foreground/10 px-4 pb-3 pt-2 text-[11px] text-foreground/50">
      Mínimo 1 hora · Pago en estudio · Cancelación gratuita 24h antes
    </p>
  </div>
);

const RoomDetail = () => {
  const { slug } = useParams();
  const { room, linkedItems, isLoading, error } = useRoom(slug ?? "");
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activePhoto, setActivePhoto] = useState(0);

  const groupedItems = useMemo(() => {
    const map = new Map<string, typeof linkedItems>();
    linkedItems.forEach((it) => {
      const arr = map.get(it.category) ?? [];
      arr.push(it);
      map.set(it.category, arr);
    });
    return Array.from(map.entries());
  }, [linkedItems]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="gradient-warm border-b border-border">
          <div className="container-app py-8">
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="container-app py-12">
          <Skeleton className="aspect-[16/10] w-full" />
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="gradient-warm border-b border-border">
          <div className="container-app py-8">
            <Link to="/rooms" className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Volver al catálogo
            </Link>
          </div>
        </div>
        <div className="container-app py-16 text-center">
          <p className="text-foreground/60">Sala no encontrada o no disponible.</p>
          <Button asChild className="mt-4" variant="cta">
            <Link to="/rooms">Ver todas las salas</Link>
          </Button>
        </div>
      </div>
    );
  }

  const photos = room.photos?.length > 0 ? room.photos : [];
  const currentPhoto = photos[activePhoto] || "";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="gradient-warm border-b border-border">
        <div className="container-app py-4 lg:py-8">
          <Link to="/rooms" className="inline-flex items-center gap-1.5 text-sm text-foreground/60 transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Volver al catálogo
          </Link>
        </div>
      </div>

      <div className="container-app py-6 lg:py-16">
        <div className="grid gap-6 lg:gap-12 lg:grid-cols-12">
          {/* LEFT */}
          <div className="lg:col-span-8">
            {/* Gallery */}
            {photos.length > 0 ? (
              <>
                <div className="overflow-hidden rounded-sm shadow-warm">
                  <img
                    src={currentPhoto}
                    alt={room.name}
                    className="aspect-[4/3] w-full object-cover md:aspect-[16/10]"
                  />
                </div>
                <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 md:mt-3 md:gap-3">
                  {photos.map((g, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePhoto(i)}
                      className={`relative shrink-0 overflow-hidden rounded-sm transition-all h-12 w-[4.5rem] md:h-20 md:w-28 ${
                        i === activePhoto ? "ring-2 ring-primary" : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={g} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="aspect-[4/3] w-full overflow-hidden rounded-sm bg-muted flex items-center justify-center md:aspect-[16/10]">
                <span className="text-foreground/40 text-sm">Sin fotos</span>
              </div>
            )}

            {/* Mobile: Booking card FIRST */}
            <div className="mt-5 lg:hidden">
              <MobileBookingCard room={room} user={user} navigate={navigate} />
            </div>

            {/* Heading */}
            <div className="mt-6 lg:mt-12">
              <div className="flex flex-wrap items-center gap-2">
                {room.is_active ? (
                  <span className="inline-flex items-center gap-1.5 rounded-sm bg-foreground px-2.5 py-1 text-[11px] uppercase tracking-wider text-background">
                    <span className="h-1.5 w-1.5 rounded-full bg-sunshine" /> Disponible
                  </span>
                ) : (
                  <span className="chip">No disponible</span>
                )}
              </div>
              <h1 className="section-heading mt-4">{room.name}</h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-foreground/75 md:text-[17px]">{room.description}</p>
            </div>

            {/* Included items */}
            {linkedItems.length > 0 ? (
              <div className="mt-6 card-surface p-4 sm:p-6 lg:mt-12 lg:p-8">
                <div className="flex items-center gap-2">
                  <h2 className="sub-heading">Incluido en esta sala</h2>
                  <Info className="h-4 w-4 text-foreground/50" />
                </div>
                <Accordion type="multiple" defaultValue={[groupedItems[0]?.[0]]} className="mt-4">
                  {groupedItems.map(([cat, items]) => (
                    <AccordionItem key={cat} value={cat} className="border-foreground/10">
                      <AccordionTrigger className="hover:no-underline">
                        <span className="flex items-center gap-2">
                          <span className="chip-primary text-[10px]">{cat}</span>
                          <span className="text-sm text-foreground/60">{items.length} ítems</span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="divide-y divide-foreground/10">
                          {items.map((it) => (
                            <li key={it.id} className="flex items-center justify-between py-2.5">
                              <span className="text-sm">{it.name}</span>
                              {(it as { linkedQuantity?: number }).linkedQuantity > 1 && (
                                <span className="text-xs text-foreground/60">×{(it as { linkedQuantity?: number }).linkedQuantity}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ) : null}

            {/* Calendar */}
            <div className="mt-6 card-surface p-4 sm:p-6 lg:mt-10 lg:p-8">
              <div className="flex items-center justify-between">
                <h2 className="sub-heading">Disponibilidad</h2>
                <div className="flex items-center gap-1">
                  <button className="flex h-8 w-8 items-center justify-center rounded-sm border border-foreground/15 text-foreground/60 hover:text-foreground hover:bg-foreground/5 md:h-9 md:w-9">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded-sm border border-foreground/15 text-foreground/60 hover:text-foreground hover:bg-foreground/5 md:h-9 md:w-9">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 -mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                <div className="min-w-[340px] md:min-w-[520px] lg:min-w-0">
                  <div className="grid grid-cols-[40px_repeat(7,1fr)] gap-0.5 md:grid-cols-[50px_repeat(7,1fr)] md:gap-1">
                    <div />
                    {days.map((d) => (
                      <div key={d} className="pb-1.5 text-center text-[9px] uppercase tracking-wider text-foreground/55 md:pb-2 md:text-[11px]">{d.slice(0, 3)}</div>
                    ))}
                    {slots.map((time) => (
                      <Fragment key={time}>
                        <div className="self-center pr-0.5 text-right text-[9px] text-foreground/55 md:pr-1 md:text-[11px]">{time}</div>
                        {days.map((_, di) => {
                          const isBooked = bookedKey.has(`${di}-${time}`);
                          return (
                            <button
                              key={`${di}-${time}`}
                              disabled={isBooked || !room.is_active}
                              className={`group relative h-5 rounded-sm text-[8px] transition-all md:h-8 md:text-[10px] ${
                                isBooked
                                  ? "bg-foreground/10 text-foreground/40"
                                  : "bg-cream hover:bg-primary hover:text-primary-foreground"
                              }`}
                            >
                              {isBooked ? <Lock className="mx-auto h-2 w-2 md:h-3 md:w-3" /> : ""}
                            </button>
                          );
                        })}
                      </Fragment>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-xs text-foreground/60">
                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-cream" /> Disponible</span>
                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-foreground/10" /> Reservado</span>
              </div>
            </div>
          </div>

          {/* RIGHT — Desktop sidebar */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <div className="overflow-hidden rounded-sm shadow-warm-md bg-card border border-border">
                <div className="p-6">
                  <p className="text-[11px] uppercase tracking-wider text-foreground/55">Precio</p>
                  <p className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-[42px] leading-none tracking-tight">${room.price_per_half_hour}</span>
                    <span className="text-sm text-foreground/60">/ 30 min</span>
                  </p>
                  <p className="mt-2 text-xs text-foreground/60">Mínimo de reserva: 1 hora</p>
                </div>
                <div className="border-t border-foreground/10 p-6">
                  <Button
                    size="lg"
                    variant="cta"
                    className="w-full"
                    disabled={!room.is_active}
                    onClick={() => {
                      if (!user) {
                        navigate("/login");
                      } else if (room.is_active) {
                        navigate(`/rooms/${room.slug}/reserve`);
                      }
                    }}
                  >
                    {room.is_active ? (user ? "Reservar" : "Inicia sesión para reservar") : "No disponible"}
                  </Button>
                  <p className="mt-3 text-center text-xs text-foreground/60">
                    Pago en estudio · Cancelación gratuita 24h antes
                  </p>
                </div>
                <div className="border-t border-foreground/10 bg-cream p-6">
                  <p className="text-sm">{room.name}</p>
                  {room.description && (
                    <p className="mt-2 text-xs text-foreground/55 line-clamp-3">{room.description}</p>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RoomDetail;
