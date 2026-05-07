import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { rooms as seedRooms } from "@/data/rooms";
import { items as seedItems } from "@/data/items";

type LinkedItem = { itemId: string; name: string; category: string; qty: number };
type Maintenance = { id: string; start: string; end: string; reason: string };

const OwnerRoomForm = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(slug);
  const existing = seedRooms.find((r) => r.slug === slug);

  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [price, setPrice] = useState<number>(existing?.pricePerHalfHour ?? 12);
  const [active, setActive] = useState<boolean>(existing?.available ?? true);
  const [photos, setPhotos] = useState<string[]>(existing?.gallery ?? []);
  const [linked, setLinked] = useState<LinkedItem[]>(
    existing
      ? existing.items.slice(0, 4).map((it, i) => ({
          itemId: `seed-${i}`,
          name: it.name,
          category: it.category,
          qty: it.qty,
        }))
      : [],
  );
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);

  const removePhoto = (i: number) => setPhotos((p) => p.filter((_, idx) => idx !== i));
  const addPhotoPlaceholder = () => {
    if (photos.length >= 4) return;
    setPhotos((p) => [...p, ""]);
  };

  const removeLinked = (id: string) => setLinked((l) => l.filter((x) => x.itemId !== id));

  const [addItemId, setAddItemId] = useState<string>("");
  const [addItemQty, setAddItemQty] = useState<number>(1);
  const onAddItem = () => {
    const it = seedItems.find((i) => i.id === addItemId);
    if (!it) return;
    setLinked((l) => [
      ...l.filter((x) => x.itemId !== it.id),
      { itemId: it.id, name: it.name, category: it.category, qty: addItemQty },
    ]);
    setAddItemId("");
    setAddItemQty(1);
  };

  const [mStart, setMStart] = useState("");
  const [mEnd, setMEnd] = useState("");
  const [mReason, setMReason] = useState("");
  const onAddMaintenance = () => {
    if (!mStart || !mEnd) return;
    setMaintenance((m) => [...m, { id: crypto.randomUUID(), start: mStart, end: mEnd, reason: mReason }]);
    setMStart(""); setMEnd(""); setMReason("");
  };

  return (
    <AppShell role="owner">
      <section className="border-b border-border gradient-warm">
        <div className="container-app py-10">
          <Link to="/owner/rooms" className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Volver a salas
          </Link>
          <h1 className="display-hero mt-4">{editing ? "Editar sala" : "Nueva sala"}</h1>
        </div>
      </section>

      <section className="container-app grid gap-8 py-12 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div className="card-surface bg-card p-6">
            <h2 className="sub-heading">Información básica</h2>
            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Studio A — The Live Room" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Descripción</Label>
                <Textarea id="desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Acústica, capacidad, vibe…" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio por 30 min (€)</Label>
                  <Input id="price" type="number" min={1} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
                </div>
                <div className="flex items-end justify-between rounded-sm border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">Sala activa</p>
                    <p className="text-xs text-foreground/55">Visible y reservable.</p>
                  </div>
                  <Switch checked={active} onCheckedChange={setActive} />
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="sub-heading">Equipo enlazado</h2>
                <p className="mt-1 text-sm text-foreground/65">Inventario asignado a esta sala.</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="cta" size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Añadir
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enlazar equipo</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Item</Label>
                      <Select value={addItemId} onValueChange={setAddItemId}>
                        <SelectTrigger><SelectValue placeholder="Selecciona un item" /></SelectTrigger>
                        <SelectContent>
                          {seedItems.map((it) => (
                            <SelectItem key={it.id} value={it.id}>{it.name} · {it.category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Cantidad asignada</Label>
                      <Input type="number" min={1} value={addItemQty} onChange={(e) => setAddItemQty(Number(e.target.value))} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="cta" onClick={onAddItem} disabled={!addItemId}>Enlazar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="mt-6 divide-y divide-border">
              {linked.length === 0 && (
                <p className="py-8 text-center text-sm text-foreground/55">Sin equipo enlazado.</p>
              )}
              {linked.map((it) => (
                <div key={it.itemId} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{it.name}</p>
                    <p className="text-xs text-foreground/55">{it.category} · ×{it.qty}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeLinked(it.itemId)} className="text-destructive hover:bg-destructive/10">
                    Desenlazar
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="card-surface bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="sub-heading">Bloques de mantenimiento</h2>
                <p className="mt-1 text-sm text-foreground/65">La sala no será reservable durante estos periodos.</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Nuevo bloque
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bloque de mantenimiento</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Inicio</Label>
                        <Input type="datetime-local" value={mStart} onChange={(e) => setMStart(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Fin</Label>
                        <Input type="datetime-local" value={mEnd} onChange={(e) => setMEnd(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Motivo (interno)</Label>
                      <Textarea rows={3} value={mReason} onChange={(e) => setMReason(e.target.value)} placeholder="Cambio de baterías, limpieza acústica…" />
                    </div>
                    <div className="rounded-sm bg-warning-soft px-3 py-2 text-xs text-foreground/75">
                      Si hay reservas confirmadas que se solapen, se mostrará una alerta.
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="cta" onClick={onAddMaintenance}>Guardar bloque</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="mt-6 divide-y divide-border">
              {maintenance.length === 0 && (
                <p className="py-8 text-center text-sm text-foreground/55">Sin bloques programados.</p>
              )}
              {maintenance.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {new Date(m.start).toLocaleString("es-ES")} → {new Date(m.end).toLocaleString("es-ES")}
                    </p>
                    {m.reason && <p className="mt-0.5 text-xs text-foreground/55">{m.reason}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMaintenance((ms) => ms.filter((x) => x.id !== m.id))}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="card-surface bg-card p-6">
            <h3 className="text-sm font-medium uppercase tracking-wider text-foreground/60">Acciones</h3>
            <div className="mt-4 flex flex-col gap-2">
              <Button variant="cta" size="lg" onClick={() => navigate("/owner/rooms")}>
                {editing ? "Guardar cambios" : "Crear sala"}
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/owner/rooms")}>
                Cancelar
              </Button>
            </div>
            <div className="mt-6 rounded-sm border border-border bg-secondary/40 p-4 text-xs text-foreground/65">
              Los cambios serán visibles inmediatamente en el catálogo público de salas.
            </div>
          </div>
        </aside>
      </section>
    </AppShell>
  );
};

export default OwnerRoomForm;
