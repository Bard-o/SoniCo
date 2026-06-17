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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useItems } from "@/hooks/useItems";
import { useItem } from "@/hooks/useItem";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";
import { useMaintenanceBlocks } from "@/hooks/useMaintenanceBlocks";
import { useCreateMaintenanceBlock } from "@/hooks/useCreateMaintenanceBlock";
import { useDeleteMaintenanceBlock } from "@/hooks/useDeleteMaintenanceBlock";
import { ITEM_CATEGORIES, type ItemCategory } from "@/types/database";
import { toast } from "sonner";

const OwnerItemForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editing = Boolean(id);

  const { create, update } = useItems();
  const { item, isLoading: itemLoading, refetch: refetchItem } = useItem(id ?? "");
  const { upload, isUploading, remove: deletePhoto } = usePhotoUpload();
  const { blocks: maintenance, isLoading: mtnLoading, refetch: refetchMtn } = useMaintenanceBlocks(
    item?.id ? { item_id: item.id } : {}
  );
  const { createBlock, isProcessing: isCreatingBlock } = useCreateMaintenanceBlock();
  const { deleteBlock, isProcessing: isDeletingBlock } = useDeleteMaintenanceBlock();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Track files selected by user but not yet saved — upload only happens on "Guardar"
  const pendingUploadsRef = useRef<{ file: File; blobUrl: string }[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ItemCategory>(ITEM_CATEGORIES[0]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [totalQty, setTotalQty] = useState<number>(1);
  const [addonPrice, setAddonPrice] = useState<number>(0);
  const [rentalPrice, setRentalPrice] = useState<number>(0);
  const [availableForRental, setAvailableForRental] = useState<boolean>(true);
  const [forSale, setForSale] = useState<boolean>(false);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Maintenance block dialog state
  const [mtnDialogOpen, setMtnDialogOpen] = useState(false);
  const [mtnStart, setMtnStart] = useState("");
  const [mtnEnd, setMtnEnd] = useState("");
  const [mtnReason, setMtnReason] = useState("");

  // Populate form when editing an existing item
  useEffect(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description);
      setCategory(item.category);
      setPhotos(item.photos ?? []);
      setTotalQty(item.quantity);
      setAddonPrice(Number(item.price_addon));
      setRentalPrice(Number(item.price_rental));
      setAvailableForRental(item.is_available_for_rental);
      setForSale(item.is_for_sale);
      setSalePrice(Number(item.sale_price ?? 0));
    }
  }, [item]);

  // Cleanup blob URLs on unmount (user leaves without saving)
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
    } else if (removed.startsWith("http")) {
      // Already uploaded — delete from storage
      deletePhoto(removed);
    }
    setPhotos((p) => p.filter((_, idx) => idx !== i));
  };

  // User selects a file → show local preview, defer upload to save
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photos.length >= 4) return;
    const blobUrl = URL.createObjectURL(file);
    pendingUploadsRef.current.push({ file, blobUrl });
    setPhotos((p) => [...p, blobUrl]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onAddMaintenance = async () => {
    if (!item?.id || !mtnStart || !mtnEnd || !mtnReason) return;
    const result = await createBlock({
      item_id: item.id,
      start_datetime: new Date(mtnStart).toISOString(),
      end_datetime: new Date(mtnEnd).toISOString(),
      reason: mtnReason,
    });
    if (result.success) {
      toast.success("Bloque de mantenimiento creado");
      setMtnDialogOpen(false);
      setMtnStart("");
      setMtnEnd("");
      setMtnReason("");
      refetchMtn();
    } else {
      toast.error(result.error ?? "Error al crear el bloque");
    }
  };

  const handleDeleteMtn = async (id: string) => {
    const ok = await deleteBlock(id);
    if (ok) {
      toast.success("Bloque eliminado");
      refetchMtn();
    }
  };

  const handleSave = async () => {
    setSaveError(null);
    setIsSaving(true);
    try {
      // Upload pending photos FIRST — replace blob URLs with real Storage URLs
      let finalPhotos = [...photos];
      if (pendingUploadsRef.current.length > 0) {
        for (const pending of pendingUploadsRef.current) {
          const realUrl = await upload(pending.file, `items/${id ?? "new"}`);
          const idx = finalPhotos.indexOf(pending.blobUrl);
          if (idx !== -1) finalPhotos[idx] = realUrl;
        }
        pendingUploadsRef.current.forEach((p) => URL.revokeObjectURL(p.blobUrl));
        pendingUploadsRef.current = [];
      }
      setPhotos(finalPhotos);

      if (editing && id) {
        await update(id, {
          name,
          description,
          category,
          photos: finalPhotos,
          quantity: totalQty,
          price_addon: addonPrice,
          price_rental: rentalPrice,
          is_available_for_rental: availableForRental,
          is_for_sale: forSale,
          sale_price: forSale ? salePrice : null,
        });
      } else {
        await create({
          name,
          description,
          category,
          photos: finalPhotos,
          quantity: totalQty,
          price_addon: addonPrice,
          price_rental: rentalPrice,
          is_available_for_rental: availableForRental,
          is_for_sale: forSale,
          sale_price: forSale ? salePrice : null,
        });
      }
      navigate("/owner/items");
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  if (editing && itemLoading) {
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
                  <Select value={category} onValueChange={(v) => setCategory(v as ItemCategory)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ITEM_CATEGORIES.map((c) => (
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
                <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-foreground/25 text-foreground/55 transition hover:border-foreground/45 hover:text-foreground">
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-xs">Subir</span>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>
            {isUploading && <p className="mt-2 text-xs text-foreground/55">Subiendo foto…</p>}
          </div>

          <div className="card-surface bg-card p-6">
            <h2 className="sub-heading">Precios y disponibilidad</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="addon">Add-on por reserva</Label>
                <Input id="addon" type="number" min={0} value={addonPrice} onChange={(e) => setAddonPrice(Number(e.target.value))} />
                <p className="text-xs text-foreground/55">Precio cuando se añade a una reserva de sala.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rental">Precio de alquiler</Label>
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
                  <Label htmlFor="sale">Precio de venta</Label>
                  <Input id="sale" type="number" min={0} value={salePrice} onChange={(e) => setSalePrice(Number(e.target.value))} />
                </div>
              )}
            </div>
          </div>

          {editing && item && (
            <div className="card-surface bg-card p-6">
              <h2 className="sub-heading">Enlaces actuales</h2>
              <p className="mt-1 text-sm text-foreground/65">Salas a las que este item está asignado.</p>
              <div className="mt-5 divide-y divide-border">
                <p className="py-4 text-center text-sm text-foreground/55">Consultar salas enlazadas.</p>
              </div>
            </div>
          )}

          {editing && item && (
            <div className="card-surface bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="sub-heading">Bloques de mantenimiento</h2>
                  <p className="mt-1 text-sm text-foreground/65">El equipo no estará disponible durante estos periodos.</p>
                </div>
                <Dialog open={mtnDialogOpen} onOpenChange={setMtnDialogOpen}>
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
                          <Input type="datetime-local" value={mtnStart} onChange={(e) => setMtnStart(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Fin</Label>
                          <Input type="datetime-local" value={mtnEnd} onChange={(e) => setMtnEnd(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Motivo (interno)</Label>
                        <Textarea rows={3} placeholder="Mantenimiento preventivo, reparación…" value={mtnReason} onChange={(e) => setMtnReason(e.target.value)} />
                      </div>
                      <div className="rounded-sm bg-warning-soft px-3 py-2 text-xs text-foreground/75">
                        Los bloques de mantenimiento para equipos no cancelan reservas automáticamente.
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="cta" onClick={onAddMaintenance} disabled={!mtnStart || !mtnEnd || !mtnReason || isCreatingBlock}>
                        {isCreatingBlock ? "Guardando…" : "Guardar bloque"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="mt-6 divide-y divide-border">
                {mtnLoading ? (
                  <div className="py-4 text-center text-sm text-foreground/55">Cargando…</div>
                ) : !maintenance || maintenance.length === 0 ? (
                  <p className="py-8 text-center text-sm text-foreground/55">Sin bloques programados.</p>
                ) : (
                  maintenance.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {new Date(m.start_datetime).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} →{" "}
                          {new Date(m.end_datetime).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {m.reason && <p className="mt-0.5 text-xs text-foreground/55">{m.reason}</p>}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteMtn(m.id)} disabled={isDeletingBlock} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="card-surface bg-card p-6">
            <h3 className="text-sm font-medium uppercase tracking-wider text-foreground/60">Acciones</h3>
            {saveError && <p className="mt-2 text-xs text-destructive">{saveError}</p>}
            <div className="mt-4 flex flex-col gap-2">
              <Button variant="cta" size="lg" onClick={handleSave} disabled={isSaving || !name}>
                {isSaving ? "Guardando…" : editing ? "Guardar cambios" : "Crear item"}
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
