import { useState, useEffect, useRef } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useRooms } from "@/hooks/useRooms";
import { useRoom } from "@/hooks/useRoom";
import { useRoomItems } from "@/hooks/useRoomItems";
import { useItems } from "@/hooks/useItems";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";
import { ITEM_CATEGORIES, type ItemCategory } from "@/types/database";
import type { Item } from "@/types/database";
import { cn } from "@/lib/utils";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const OwnerRoomForm = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const editing = Boolean(slug);

  const { create, update } = useRooms();
  const { room, isLoading: roomLoading, refetch: refetchRoom } = useRoom(slug ?? "");
  const { linkedItems, isLoading: linksLoading, link, unlink, refetch: refetchLinks } = useRoomItems(room?.id ?? "");
  const { items: allItems } = useItems();
  const { upload, isUploading } = usePhotoUpload();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadsRef = useRef<{ file: File; blobUrl: string }[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(12);
  const [active, setActive] = useState(true);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Maintenance (preserved, not wired)
  const [maintenance, setMaintenance] = useState<{ id: string; start: string; end: string; reason: string }[]>([]);

  // Link manager dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [addItemId, setAddItemId] = useState<string>("");
  const [addItemQty, setAddItemQty] = useState<number>(1);

  // Load existing room data
  useEffect(() => {
    if (room) {
      setName(room.name);
      setDescription(room.description);
      setPrice(Number(room.price_per_half_hour));
      setActive(room.is_active);
      setPhotos(room.photos ?? []);
    }
  }, [room]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      pendingUploadsRef.current.forEach((p) => URL.revokeObjectURL(p.blobUrl));
      pendingUploadsRef.current = [];
    };
  }, []);

  const removePhoto = (i: number) => {
    const removed = photos[i];
    if (removed.startsWith("blob:")) {
      URL.revokeObjectURL(removed);
      pendingUploadsRef.current = pendingUploadsRef.current.filter((p) => p.blobUrl !== removed);
    }
    setPhotos((p) => p.filter((_, idx) => idx !== i));
  };

  // Show local preview immediately, upload only on save — avoids orphaned photos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photos.length >= 4) return;
    const blobUrl = URL.createObjectURL(file);
    pendingUploadsRef.current.push({ file, blobUrl });
    setPhotos((p) => [...p, blobUrl]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeLinked = async (itemId: string) => {
    if (!room?.id) return;
    await unlink(itemId);
  };

  const onAddItem = async () => {
    if (!room?.id || !addItemId) return;
    await link(addItemId, addItemQty);
    setAddItemId("");
    setAddItemQty(1);
    setLinkDialogOpen(false);
  };

  const onAddMaintenance = () => {
    setMaintenance((m) => [...m, { id: crypto.randomUUID(), start: "", end: "", reason: "" }]);
  };

  const handleSave = async () => {
    setSaveError(null);
    setIsSaving(true);
    try {
      // Upload pending photos before saving
      let finalPhotos = [...photos];
      if (pendingUploadsRef.current.length > 0) {
        for (const pending of pendingUploadsRef.current) {
          const realUrl = await upload(pending.file, `rooms/${room?.id ?? "new"}`);
          const idx = finalPhotos.indexOf(pending.blobUrl);
          if (idx !== -1) finalPhotos[idx] = realUrl;
        }
        pendingUploadsRef.current.forEach((p) => URL.revokeObjectURL(p.blobUrl));
        pendingUploadsRef.current = [];
      }
      setPhotos(finalPhotos);

      if (editing && room) {
        await update(room.id, {
          name,
          description,
          price_per_half_hour: price,
          is_active: active,
          photos: finalPhotos,
          slug: slugify(name),
        });
      } else {
        const newRoom = await create({
          name,
          description,
          price_per_half_hour: price,
          is_active: active,
          photos: finalPhotos,
          slug: slugify(name),
        });
        navigate(`/owner/rooms/${newRoom.slug}/edit`, { replace: true });
      }
      navigate("/owner/rooms");
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  if (editing && roomLoading) {
    return (
      <AppShell role="owner">
        <section className="border-b border-border gradient-warm">
          <div className="container-app py-10">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-4 h-12 w-64" />
          </div>
        </section>
      </AppShell>
    );
  }

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
                <div>
                  {editing && room ? (
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-foreground/25 text-foreground/55 transition hover:border-foreground/45 hover:text-foreground">
                      <ImagePlus className="h-5 w-5" />
                      <span className="text-xs">Subir</span>
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
                    </label>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-foreground/25 text-foreground/55 transition hover:border-foreground/45 hover:text-foreground">
                      <ImagePlus className="h-5 w-5" />
                      <span className="text-xs">Subir</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={addPhotoFromNew} />
                    </label>
                  )}
                </div>
              )}
            </div>
            {isUploading && <p className="mt-2 text-xs text-foreground/55">Subiendo foto…</p>}
          </div>

          {editing && room && (
            <div className="card-surface bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="sub-heading">Equipo enlazado</h2>
                  <p className="mt-1 text-sm text-foreground/65">Inventario asignado a esta sala.</p>
                </div>
                <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
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
                            {allItems.map((it) => (
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
                {linksLoading ? (
                  <div className="py-4 text-center text-sm text-foreground/55">Cargando…</div>
                ) : linkedItems.length === 0 ? (
                  <p className="py-8 text-center text-sm text-foreground/55">Sin equipo enlazado.</p>
                ) : (
                  linkedItems.map((it) => (
                    <div key={it.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{it.name}</p>
                        <p className="text-xs text-foreground/55">{it.category} · ×{it.linkedQuantity}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeLinked(it.id)} className="text-destructive hover:bg-destructive/10">
                        Desenlazar
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

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
                        <Input type="datetime-local" />
                      </div>
                      <div className="space-y-2">
                        <Label>Fin</Label>
                        <Input type="datetime-local" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Motivo (interno)</Label>
                      <Textarea rows={3} placeholder="Cambio de baterías, limpieza acústica…" />
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
                    <p className="text-sm font-medium">{m.start || "(sin fecha)"} → {m.end || "(sin fecha)"}</p>
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
            {saveError && <p className="mt-2 text-xs text-destructive">{saveError}</p>}
            <div className="mt-4 flex flex-col gap-2">
              <Button variant="cta" size="lg" onClick={handleSave} disabled={isSaving || !name}>
                {isSaving ? "Guardando…" : editing ? "Guardar cambios" : "Crear sala"}
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
