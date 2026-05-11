import { useMemo, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { ItemCard } from "@/components/equipment/ItemCard";
import { CartSummary } from "@/components/equipment/CartSummary";
import { useRentalItems } from "@/hooks/useRentalItems";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/contexts/CartContext";

const CATEGORIES = [
  "Percusión", "Amplificadores guitarra", "Amplificadores bajo",
  "Teclados", "Micrófonos", "Consola", "Monitores",
  "Pedales", "Cables y accesorios", "Otros",
] as const;

const Equipment = () => {
  const [cat, setCat] = useState<string>("Todo");
  const { items, isLoading, error } = useRentalItems();
  const { count } = useCart();

  const visible = useMemo(() => {
    if (!items) return [];
    return cat === "Todo" ? items : items.filter((i) => i.category === cat);
  }, [items, cat]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="border-b border-border gradient-warm">
          <div className="container-app py-16 lg:py-20">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-5 h-14 w-96 max-w-full" />
            <Skeleton className="mt-6 h-5 w-80" />
          </div>
        </div>
        <div className="container-app py-12 lg:py-16">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="overflow-hidden rounded-sm border border-border bg-card">
                <Skeleton className="aspect-[4/3]" />
                <div className="p-5">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="mt-2 h-4 w-full" />
                  <Skeleton className="mt-1 h-4 w-5/6" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="border-b border-border gradient-warm">
          <div className="container-app py-16 lg:py-20">
            <p className="eyebrow">— Catálogo</p>
            <h1 className="display-hero mt-5 max-w-3xl">Alquiler de equipo</h1>
          </div>
        </div>
        <div className="container-app py-12 lg:py-16">
          <div className="rounded-sm border border-border bg-card p-10 text-center">
            <p className="text-[15px] text-foreground/60">Error al cargar el catálogo.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Reintentar
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero section */}
      <section className="border-b border-border gradient-warm">
        <div className="container-app py-16 lg:py-20">
          <p className="eyebrow">— Catálogo</p>
          <h1 className="display-hero mt-5 max-w-3xl">Alquiler de equipo</h1>
          <p className="mt-6 max-w-xl text-[17px] text-foreground/70">
            Amplificadores, micrófonos, percusión y más. Construí tu carro y solicitá el alquiler en minutos.
          </p>
        </div>
      </section>

      {/* Sticky filter bar */}
      <div className="sticky top-16 z-30 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container-app flex items-center gap-3 py-4">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {["Todo", ...CATEGORIES].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`shrink-0 rounded-sm border px-3.5 py-1.5 text-[12px] uppercase tracking-wider transition-all ${
                  cat === c
                    ? "border-foreground bg-foreground text-background"
                    : "border-foreground/15 bg-background text-foreground/70 hover:border-foreground/40"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          {/* Mobile cart trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="relative shrink-0 lg:hidden">
                <ShoppingBag className="h-4 w-4" />
                {count > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                    {count}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Tu carro</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <CartSummary items={items} compact />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Content */}
      <section className="py-12 lg:py-16">
        <div className="container-app grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8 xl:col-span-9">
            {visible.length === 0 ? (
              <div className="rounded-sm border border-dashed border-border bg-card py-20 text-center">
                <p className="text-[15px] text-foreground/60">No hay equipo en esta categoría.</p>
                <button
                  onClick={() => setCat("Todo")}
                  className="mt-3 text-[13px] text-primary underline-offset-4 hover:underline"
                >
                  Ver todo el catálogo
                </button>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((it) => (
                  <ItemCard key={it.id} item={it} />
                ))}
              </div>
            )}
          </div>
          {/* Desktop cart sidebar */}
          <div className="hidden lg:col-span-4 lg:block xl:col-span-3">
            <div className="sticky top-36">
              <CartSummary items={items} />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Equipment;
