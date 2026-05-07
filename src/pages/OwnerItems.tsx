import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Boxes, Pencil, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
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
import { items as seedItems, itemCategories } from "@/data/items";
import { cn } from "@/lib/utils";

const OwnerItems = () => {
  const [items, setItems] = useState(seedItems);
  const [category, setCategory] = useState<string>("Todas");

  const filtered = useMemo(
    () => (category === "Todas" ? items : items.filter((i) => i.category === category)),
    [items, category],
  );

  const remove = (id: string) => setItems((xs) => xs.filter((x) => x.id !== id));

  return (
    <AppShell role="owner">
      <section className="border-b border-border gradient-warm">
        <div className="container-app flex flex-wrap items-end justify-between gap-6 py-12">
          <div>
            <p className="eyebrow">— Inventario</p>
            <h1 className="display-hero mt-4">Equipo</h1>
            <p className="mt-4 max-w-xl text-[15px] text-foreground/70">
              Catálogo de equipo del estudio. Define qué se puede alquilar, qué está enlazado a salas y qué está a la venta.
            </p>
          </div>
          <Button asChild variant="cta" size="lg" className="gap-2">
            <Link to="/owner/items/new">
              <Plus className="h-4 w-4" /> Añadir item
            </Link>
          </Button>
        </div>
      </section>

      <section className="container-app py-10">
        <div className="flex flex-wrap gap-2">
          {["Todas", ...itemCategories].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-sm border px-3 py-1.5 text-xs uppercase tracking-wider transition",
                category === c
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-foreground/70 hover:text-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <section className="container-app pb-16">
        {filtered.length === 0 ? (
          <div className="card-surface bg-card p-16 text-center">
            <Boxes className="mx-auto h-8 w-8 text-foreground/40" />
            <p className="mt-3 text-foreground/60">Sin items en esta categoría.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((it) => (
              <article key={it.id} className="card-surface flex flex-col overflow-hidden bg-card">
                <div className="relative aspect-square overflow-hidden bg-secondary/60">
                  {it.image ? (
                    <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-foreground/30">
                      <Boxes className="h-10 w-10" />
                    </div>
                  )}
                  <span className="absolute left-3 top-3 chip">{it.category}</span>
                  {!it.availableForRental && (
                    <span className="absolute right-3 top-3 inline-flex items-center rounded-sm bg-muted px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-foreground/60">
                      No alquilable
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-[15px] tracking-tight">{it.name}</h3>
                  <p className="mt-0.5 text-xs text-foreground/55">Stock total: {it.totalQty}</p>

                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
                    <div>
                      <p className="text-foreground/55">Add-on</p>
                      <p className="font-medium">€{it.addonPrice}</p>
                    </div>
                    <div>
                      <p className="text-foreground/55">Alquiler</p>
                      <p className="font-medium">€{it.rentalPrice}</p>
                    </div>
                    {it.forSale && it.salePrice != null && (
                      <div className="col-span-2">
                        <p className="text-foreground/55">Venta</p>
                        <p className="font-medium">€{it.salePrice}</p>
                      </div>
                    )}
                  </div>

                  {it.linkedRooms.length > 0 && (
                    <p className="mt-3 text-[11px] text-foreground/55">
                      Enlazado a:{" "}
                      <span className="text-foreground/75">
                        {it.linkedRooms.map((r) => `${r.roomName} (×${r.qty})`).join(", ")}
                      </span>
                    </p>
                  )}

                  <div className="mt-auto flex gap-2 pt-4">
                    <Button asChild variant="outline" size="sm" className="flex-1 gap-1.5">
                      <Link to={`/owner/items/${it.id}/edit`}>
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar "{it.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {it.linkedRooms.length > 0
                              ? `Este item está enlazado a ${it.linkedRooms.length} sala(s). Al eliminarlo se desenlazará automáticamente.`
                              : "Esta acción no se puede deshacer."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => remove(it.id)}
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

export default OwnerItems;
