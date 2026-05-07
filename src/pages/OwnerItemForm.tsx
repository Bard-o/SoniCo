import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { items as seedItems, itemCategories } from "@/data/items";

const OwnerItemForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const existing = seedItems.find((i) => i.id === id);

  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [category, setCategory] = useState<string>(existing?.category ?? itemCategories[0]);
  const [photos, setPhotos] = useState<string[]>(existing?.image ? [existing.image] : []);
  const [totalQty, setTotalQty] = useState<number>(existing?.totalQty ?? 1);
  const [addonPrice, setAddonPrice] = useState<number>(existing?.addonPrice ?? 0);
  const [rentalPrice, setRentalPrice] = useState<number>(existing?.rentalPrice ?? 0);
  const [availableForRental, setAvailableForRental] = useState<boolean>(existing?.availableForRental ?? true);
  const [forSale, setForSale] = useState<boolean>(existing?.forSale ?? false);
  const [salePrice, setSalePrice] = useState<number>(existing?.salePrice ?? 0);

  const removePhoto = (i: number) => setPhotos((p) => p.filter((_, idx) => idx !== i));
  const addPhotoPlaceholder = () => {
    if (photos.length >= 4) return;
    setPhotos((p) => [...p, ""]);
  };

  return (
    <AppShell role="owner">
      <section className="border-b border-border gradient-warm">
        <div className="container-app py-10">
          <Link to="/owner/items" className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Volver al inventario
          </Link>
          <h1 className="display-hero mt-4">{editing ? "Editar item" : "Nuevo item"}</h1>
        </div>
      </section>

      <section className="container-app grid gap-8 py-12 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div className="card-surface bg-card p-6">
            <h2 className="sub-heading">Información</h2>
            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Marshall JCM800" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Descripción</Label>
                <Textarea id="desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {itemCategories.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qty">Cantidad total</Label>
                  <Input id="qty" type="number" min={1} value={totalQty} onChange={(e) => setTotalQty(Number(e.target.value))} />
                </div>
              </div>
            </div>
          </div>

          <div className="card-surface bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="sub-heading">Fotos</h2>
              <span className="text-xs text-foreground/55">Máx 4 · JPEG/PNG/WebP · 3 MB</span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {photos.map((src, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-sm border border-border bg-muted">
                  {src ? (
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-foreground/40">Foto {i + 1}</div>
                  )}
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-sm bg-background/90 text-foreground opacity-0 shadow-sm transition group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {photos.length < 4 && (
                <button
                  onClick={addPhotoPlaceholder}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-foreground/25 text-foreground/55 transition hover:border-foreground/45 hover:text-foreground"
                >
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-xs">Subir</span>
                </button>
              )}
            </div>
          </div>

          <div className="card-surface bg-card p-6">
            <h2 className="sub-heading">Precios y disponibilidad</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="addon">Add-on por reserva (€)</Label>
                <Input id="addon" type="number" min={0} value={addonPrice} onChange={(e) => setAddonPrice(Number(e.target.value))} />
                <p className="text-xs text-foreground/55">Precio cuando se añade a una reserva de sala.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rental">Precio de alquiler (€)</Label>
                <Input id="rental" type="number" min={0} value={rentalPrice} onChange={(e) => setRentalPrice(Number(e.target.value))} />
                <p className="text-xs text-foreground/55">Precio para alquileres standalone.</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between rounded-sm border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Disponible para alquiler</p>
                  <p className="text-xs text-foreground/55">Aparecerá en el catálogo público.</p>
                </div>
                <Switch checked={availableForRental} onCheckedChange={setAvailableForRental} />
              </div>
              <div className="flex items-center justify-between rounded-sm border border-border p-3">
                <div>
                  <p className="text-sm font-medium">A la venta</p>
                  <p className="text-xs text-foreground/55">Permite ofrecerlo en venta directa.</p>
                </div>
                <Switch checked={forSale} onCheckedChange={setForSale} />
              </div>
              {forSale && (
                <div className="space-y-2">
                  <Label htmlFor="sale">Precio de venta (€)</Label>
                  <Input id="sale" type="number" min={0} value={salePrice} onChange={(e) => setSalePrice(Number(e.target.value))} />
                </div>
              )}
            </div>
          </div>

          {editing && existing && existing.linkedRooms.length > 0 && (
            <div className="card-surface bg-card p-6">
              <h2 className="sub-heading">Enlaces actuales</h2>
              <p className="mt-1 text-sm text-foreground/65">Salas a las que este item está asignado.</p>
              <div className="mt-5 divide-y divide-border">
                {existing.linkedRooms.map((r) => (
                  <div key={r.roomName} className="flex items-center justify-between py-3 text-sm">
                    <span>{r.roomName}</span>
                    <span className="text-foreground/55">{r.qty} unidad{r.qty > 1 ? "es" : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="card-surface bg-card p-6">
            <h3 className="text-sm font-medium uppercase tracking-wider text-foreground/60">Acciones</h3>
            <div className="mt-4 flex flex-col gap-2">
              <Button variant="cta" size="lg" onClick={() => navigate("/owner/items")}>
                {editing ? "Guardar cambios" : "Crear item"}
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/owner/items")}>
                Cancelar
              </Button>
            </div>
          </div>
        </aside>
      </section>
    </AppShell>
  );
};

export default OwnerItemForm;
