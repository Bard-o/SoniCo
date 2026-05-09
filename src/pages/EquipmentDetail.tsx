import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Minus, Plus, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRentalItem } from "@/hooks/useRentalItem";
import { useRentalItems } from "@/hooks/useRentalItems";
import { useCart } from "@/contexts/CartContext";

const EquipmentDetail = () => {
  const { id } = useParams();
  const { item, isLoading, error } = useRentalItem(id ?? "");
  const { items } = useRentalItems();
  const { lines, add, setQty } = useCart();

  const line = lines.find((l) => l.itemId === item?.id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="gradient-warm border-b border-border">
          <div className="container-app py-8">
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="container-app py-12 lg:py-16">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Skeleton className="aspect-[4/3] rounded-sm" />
            </div>
            <div className="lg:col-span-5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-4 h-10 w-full" />
              <Skeleton className="mt-5 h-20 w-full" />
            </div>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="gradient-warm border-b border-border">
          <div className="container-app py-8">
            <Link
              to="/equipment"
              className="inline-flex items-center gap-1.5 text-sm text-foreground/60 transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Volver al catálogo
            </Link>
          </div>
        </div>
        <div className="container-app py-12 lg:py-16">
          <div className="rounded-sm border border-border bg-card p-10 text-center">
            <p className="text-[15px] text-foreground/60">Este equipo no existe o no está disponible.</p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to="/equipment">Volver al catálogo</Link>
            </Button>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Breadcrumb */}
      <div className="gradient-warm border-b border-border">
        <div className="container-app py-8">
          <Link
            to="/equipment"
            className="inline-flex items-center gap-1.5 text-sm text-foreground/60 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al catálogo
          </Link>
        </div>
      </div>

      <div className="container-app py-12 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* LEFT: Photo + upcoming reservations */}
          <div className="lg:col-span-7">
            {/* Photo */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-cream">
              {item.photos?.[0] ? (
                <img src={item.photos[0]} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 grid place-items-center">
                  <span className="block h-32 w-32 gradient-block" aria-hidden />
                </div>
              )}
            </div>

            {/* Upcoming reservations placeholder */}
            <div className="mt-10">
              <p className="eyebrow">— Próximas reservas confirmadas</p>
              <h2 className="mt-3 text-2xl font-medium tracking-tight">Calendario de uso</h2>
              <p className="mt-2 max-w-lg text-[14px] text-foreground/60">
                Estas son las próximas franjas en las que este equipo ya está reservado dentro de salas.
              </p>
              <div className="mt-6 overflow-hidden rounded-sm border border-border bg-card">
                <div className="px-6 py-10 text-center">
                  <Calendar className="mx-auto mb-3 h-6 w-6 text-foreground/40" />
                  <p className="text-[14px] text-foreground/60">Sin reservas próximas. Disponible inmediatamente.</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Item info + add to cart */}
          <aside className="lg:col-span-5">
            <div className="sticky top-24">
              <span className="inline-flex items-center rounded-sm bg-cream px-2.5 py-1 text-[11px] uppercase tracking-wider">
                {item.category}
              </span>
              <h1 className="mt-4 text-4xl font-medium leading-tight tracking-tight lg:text-5xl">
                {item.name}
              </h1>
              <p className="mt-5 text-[15px] leading-relaxed text-foreground/70">{item.description}</p>

              {/* Price cards */}
              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-sm border border-border bg-card p-4">
                  <p className="text-[11px] uppercase tracking-wider text-foreground/55">Por hora</p>
                  <p className="mt-1 text-2xl font-medium tracking-tight">
                    ${item.price_rental.toLocaleString("es-AR")}
                  </p>
                  <p className="mt-1 text-[11px] text-foreground/50">por solicitud</p>
                </div>
                <div className="rounded-sm border border-border bg-card p-4">
                  <p className="text-[11px] uppercase tracking-wider text-foreground/55">Add-on en sala</p>
                  <p className="mt-1 text-2xl font-medium tracking-tight">
                    ${item.price_addon.toLocaleString("es-AR")}
                  </p>
                  <p className="mt-1 text-[11px] text-foreground/50">por reserva</p>
                </div>
              </div>

              {/* Inventory stats */}
              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border pt-6 text-[13px]">
                <dt className="text-foreground/55">Inventario total</dt>
                <dd className="text-right tabular-nums">{item.quantity} unidades</dd>
                <dt className="text-foreground/55">Disponibles para alquiler</dt>
                <dd className="text-right tabular-nums">{item.available_units} unidades</dd>
              </dl>

              {/* Add to cart */}
              <div className="mt-8">
                {!line ? (
                  <Button
                    variant="cta"
                    size="lg"
                    className="w-full"
                    onClick={() => add(item.id)}
                  >
                    <Plus className="h-4 w-4" /> Añadir al carro
                  </Button>
                ) : (
                  <div className="flex items-center justify-between rounded-sm border border-foreground/20 bg-background p-2">
                    <button
                      onClick={() => setQty(item.id, line.qty - 1)}
                      className="grid h-11 w-11 place-items-center transition-colors hover:bg-foreground/5"
                      aria-label="Disminuir"
                    >
                      {line.qty === 1 ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                    </button>
                    <span className="text-base tabular-nums">{line.qty} en el carro</span>
                    <button
                      onClick={() => setQty(item.id, line.qty + 1)}
                      disabled={line.qty >= item.available_units}
                      className="grid h-11 w-11 place-items-center transition-colors hover:bg-foreground/5 disabled:pointer-events-none disabled:opacity-40"
                      aria-label="Aumentar"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <Button asChild variant="outline" size="lg" className="mt-3 w-full">
                  <Link to="/equipment">Seguir explorando</Link>
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
};

export default EquipmentDetail;
