import { Fragment, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Info, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoom } from "@/hooks/useRoom";
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

const RoomDetail = () => {
  const { slug } = useParams();
  const { room, linkedItems, isLoading, error } = useRoom(slug ?? "");

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
        <div className="container-app py-8">
          <Link to="/rooms" className="inline-flex items-center gap-1.5 text-sm text-foreground/60 transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Volver al catálogo
          </Link>
        </div>
      </div>

      <div className="container-app py-12 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* LEFT */}
          <div className="lg:col-span-8">
            {/* Gallery */}
            {photos.length > 0 ? (
              <>
                <div className="overflow-hidden rounded-sm shadow-warm">
                  <img
                    src={currentPhoto}
                    alt={room.name}
                    width={1280}
                    height={896}
                    className="aspect-[16/10] w-full object-cover"
                  />
                </div>
                <div className="mt-3 flex gap-3">
                  {photos.map((g, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePhoto(i)}
                      className={`relative h-20 w-28 overflow-hidden rounded-sm transition-all ${
                        i === activePhoto ? "ring-2 ring-primary" : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={g} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="aspect-[16/10] w-full overflow-hidden rounded-sm bg-muted flex items-center justify-center">
                <span className="text-foreground/40 text-sm">Sin fotos</span>
              </div>
            )}

            {/* Heading */}
            <div className="mt-12">
              <div className="flex flex-wrap items-center gap-2">
                {room.is_active ? (
                  <span className="inline-flex items-center gap-1.5 rounded-sm bg-foreground px-2.5 py-1 text-[11px] uppercase tracking-wider text-background">
                    <span className="h-1.5 w-1.5 rounded-full bg-sunshine" /> Disponible
                  </span>
                ) : (
                  <span className="chip">No disponible</span>
                )}
              </div>
              <h1 className="section-heading mt-5">{room.name}</h1>
              <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-foreground/75">{room.description}</p>
            </div>

            {/* Included items */}
            {linkedItems.length > 0 ? (
              <div className="mt-12 card-surface p-6 sm:p-8">
                <div className="flex items-center gap-2">
                  <h2 className="sub-heading">Incluido en esta sala</h2>
                  <Info className="h-4 w-4 text-foreground/50" />
                </div>
                <Accordion type="multiple" defaultValue={[groupedItems[0]?.[0]]} className="mt-5">
                  {groupedItems.map(([cat, items]) => (
                    <AccordionItem key={cat} value={cat} className="border-foreground/10">
                      <AccordionTrigger className="hover:no-underline">
                        <span className="flex items-center gap-3">
                          <span className="chip-primary">{cat}</span>
                          <span className="text-sm text-foreground/60">{items.length} ítems</span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="divide-y divide-foreground/10">
                          {items.map((it) => (
                            <li key={it.id} className="flex items-center justify-between py-3">
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
            <div className="mt-10 card-surface p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <h2 className="sub-heading">Disponibilidad esta semana</h2>
                <div className="flex items-center gap-1">
                  <button className="flex h-9 w-9 items-center justify-center rounded-sm border border-foreground/15 text-foreground/60 hover:text-foreground hover:bg-foreground/5">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button className="flex h-9 w-9 items-center justify-center rounded-sm border border-foreground/15 text-foreground/60 hover:text-foreground hover:bg-foreground/5">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <div className="min-w-[640px]">
                  <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1">
                    <div />
                    {days.map((d) => (
                      <div key={d} className="pb-3 text-center text-[11px] uppercase tracking-wider text-foreground/55">{d}</div>
                    ))}
                    {slots.map((time) => (
                      <Fragment key={time}>
                        <div className="self-center pr-2 text-right text-[11px] text-foreground/55">{time}</div>
                        {days.map((_, di) => {
                          const isBooked = bookedKey.has(`${di}-${time}`);
                          return (
                            <button
                              key={`${di}-${time}`}
                              disabled={isBooked || !room.is_active}
                              className={`group relative h-8 rounded-sm text-[10px] transition-all ${
                                isBooked
                                  ? "bg-foreground/10 text-foreground/40"
                                  : "bg-cream hover:bg-primary hover:text-primary-foreground"
                              }`}
                            >
                              {isBooked ? <Lock className="mx-auto h-3 w-3" /> : ""}
                            </button>
                          );
                        })}
                      </Fragment>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-5 text-xs text-foreground/60">
                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-cream" /> Disponible</span>
                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-foreground/10" /> Reservado</span>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <div className="overflow-hidden rounded-sm shadow-warm-md bg-card border border-border">
                <div className="p-6">
                  <p className="text-[11px] uppercase tracking-wider text-foreground/55">Precio</p>
                  <p className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-[42px] leading-none tracking-tight">€{room.price_per_half_hour}</span>
                    <span className="text-sm text-foreground/60">/ 30 min</span>
                  </p>
                  <p className="mt-2 text-xs text-foreground/60">Mínimo de reserva: 1 hora</p>
                </div>
                <div className="border-t border-foreground/10 p-6">
                  <Button size="lg" variant="cta" className="w-full" disabled={!room.is_active}>
                    {room.is_active ? "Inicia sesión para reservar" : "No disponible"}
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

      <SiteFooter />
    </div>
  );
};

export default RoomDetail;
