import { Fragment, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  CalendarIcon,
  Check,
  ChevronRight,
  CircleCheck,
  Clock,
  Minus,
  Plus,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { useRoom } from "@/hooks/useRoom";
import { useItems } from "@/hooks/useItems";
import { useStudioSettings } from "@/hooks/useStudioSettings";
import { useCreateReservation } from "@/hooks/useCreateReservation";
import { cn } from "@/lib/utils";
import { MIN_RESERVATION_HALF_HOURS } from "@/config/constants";
import type { Item } from "@/types/database";

const STEPS = ["Fecha y duración", "Equipo extra", "Confirmar"];

const DAYS_OF_WEEK = [
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
] as const;

function minutesToLabel(min: number) {
  const h = min / 60;
  if (h === 1) return "1 hora";
  if (Number.isInteger(h)) return `${h} horas`;
  return `${h} horas`;
}

function computeEnd(start: string, halfHours: number) {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + halfHours * 30;
  const eh = Math.floor(total / 60);
  const em = total % 60;
  return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-3">
      {STEPS.map((label, i) => {
        const idx = i + 1;
        const done = step > idx;
        const active = step === idx;
        return (
          <Fragment key={label}>
            <li className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-[12px] font-medium",
                  done && "border-foreground bg-foreground text-background",
                  active && "border-foreground bg-background text-foreground",
                  !done && !active && "border-foreground/20 text-foreground/40",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : idx}
              </span>
              <span
                className={cn(
                  "hidden text-sm sm:inline",
                  active ? "text-foreground" : "text-foreground/55",
                )}
              >
                {label}
              </span>
            </li>
            {idx < STEPS.length && <ChevronRight className="h-4 w-4 text-foreground/30" />}
          </Fragment>
        );
      })}
    </ol>
  );
}

function generateTimeSlots(openHour: number, closeHour: number): string[] {
  const slots: string[] = [];
  for (let h = openHour; h < closeHour; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
}

const RequestReservation = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { room, linkedItems, isLoading: roomLoading, error: roomError } = useRoom(slug ?? "");
  const { items: allItems, isLoading: itemsLoading } = useItems();
  const { settings, isLoading: settingsLoading } = useStudioSettings();
  const { createReservation, isCreating, error: createError } = useCreateReservation();

  const [step, setStep] = useState(1);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [start, setStart] = useState("");
  const [halves, setHalves] = useState(MIN_RESERVATION_HALF_HOURS);
  const [bandName, setBandName] = useState("");
  const [extras, setExtras] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Compute studio hours for selected day
  const daySlots = useMemo(() => {
    if (!settings || !date) return [];
    const dayName = DAYS_OF_WEEK[date.getDay()];
    const range = settings.hours_per_day[dayName];
    if (!range || range.length < 2) return [];
    return generateTimeSlots(range[0], range[1]);
  }, [settings, date]);

  const timeSlots = useMemo(() => {
    return daySlots;
  }, [daySlots]);

  // Auto-select first time slot when day changes
  useMemo(() => {
    if (timeSlots.length > 0 && !timeSlots.includes(start)) {
      setStart(timeSlots[0]);
    }
  }, [timeSlots, start]);

  const end = useMemo(() => computeEnd(start, halves), [start, halves]);
  const closesAfter = useMemo(() => {
    if (!settings || !date) return false;
    const dayName = DAYS_OF_WEEK[date.getDay()];
    const range = settings.hours_per_day[dayName];
    if (!range || range.length < 2) return false;
    const endHour = parseInt(end.split(":")[0], 10);
    const endMin = parseInt(end.split(":")[1], 10);
    return endHour > range[1] || (endHour === range[1] && endMin > 0);
  }, [end, settings, date]);
  const tooShort = halves < MIN_RESERVATION_HALF_HOURS;

  // Add-on items: filter by price_addon > 0, exclude items linked to this room
  const extraItems = useMemo(() => {
    if (!allItems) return [];
    const linkedIds = new Set(linkedItems.map((li) => li.id));
    return allItems.filter((it) => it.price_addon > 0 && !linkedIds.has(it.id));
  }, [allItems, linkedItems]);

  const grouped = useMemo(() => {
    const m = new Map<string, typeof extraItems>();
    extraItems.forEach((it) => {
      const a = m.get(it.category) ?? [];
      a.push(it);
      m.set(it.category, a);
    });
    return Array.from(m.entries());
  }, [extraItems]);

  const setQty = (id: string, n: number) =>
    setExtras((s) => {
      const next = { ...s };
      if (n <= 0) delete next[id];
      else next[id] = n;
      return next;
    });

  const activeExtras = useMemo(
    () => allItems ? Object.entries(extras).map(([id, qty]) => ({ item: allItems.find((i) => i.id === id)!, qty })).filter((e) => e.item) : [],
    [extras, allItems]
  );

  const roomTotal = useMemo(() => {
    if (!room) return 0;
    return room.price_per_half_hour * halves;
  }, [room, halves]);

  const extrasTotal = useMemo(() => {
    return activeExtras.reduce((sum, { item, qty }) => sum + item.price_addon * qty, 0);
  }, [activeExtras]);

  const total = roomTotal + extrasTotal;

  const handleSubmit = async () => {
    if (!room || !date || !start) return;

    const dateStr = format(date, "yyyy-MM-dd");
    // Bogota is UTC-5, no DST
    const startISO = new Date(`${dateStr}T${start}:00-05:00`).toISOString();
    const endISO = new Date(`${dateStr}T${end}:00-05:00`).toISOString();

    const items = activeExtras.map(({ item, qty }) => ({
      item_id: item.id,
      quantity: qty,
      unit_price: item.price_addon,
    }));

    const result = await createReservation({
      room_id: room.id,
      band_name: bandName || undefined,
      start_time: startISO,
      end_time: endISO,
      total_price: total,
      items,
    });

    if (result) {
      setIsSubmitted(true);
    }
  };

  // Loading state
  if (roomLoading || settingsLoading) {
    return (
      <AppShell role="user">
        <div className="gradient-warm border-b border-border">
          <div className="container-app py-8">
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="container-app py-12">
          <Skeleton className="h-96 w-full" />
        </div>
      </AppShell>
    );
  }

  // Error / not found
  if (roomError || !room) {
    return (
      <AppShell role="user">
        <div className="container-app py-16 text-center">
          <p className="text-foreground/60">Sala no encontrada.</p>
          <Button asChild className="mt-4" variant="cta">
            <Link to="/rooms">Ver todas las salas</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  // Room inactive
  if (!room.is_active) {
    return (
      <AppShell role="user">
        <div className="container-app py-16 text-center">
          <p className="text-foreground/60">Esta sala no está disponible actualmente.</p>
          <Button asChild className="mt-4" variant="cta">
            <Link to="/rooms">Ver todas las salas</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  // Success screen
  if (isSubmitted) {
    return (
      <AppShell role="user">
        <div className="container-app flex min-h-[60vh] items-center justify-center py-16">
          <div className="card-surface max-w-lg p-10 text-center">
            <CircleCheck className="mx-auto h-12 w-12 text-foreground" />
            <h1 className="section-heading mt-6">Solicitud enviada</h1>
            <p className="mt-4 text-foreground/70">
              Recibimos tu solicitud para <span className="font-medium">{room.name}</span>. Te
              avisaremos en cuanto el estudio la confirme.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Button asChild variant="outline">
                <Link to="/app">Volver al inicio</Link>
              </Button>
              <Button asChild variant="cta">
                <Link to="/app/reservations">Ver mis reservas</Link>
              </Button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const photo = room.photos?.[0] ?? "";

  return (
    <AppShell role="user">
      <div className="gradient-warm border-b border-border">
        <div className="container-app py-8">
          <Link
            to={`/rooms/${room.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-foreground/60 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Volver a la sala
          </Link>
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-5">
              {photo ? (
                <img
                  src={photo}
                  alt={room.name}
                  className="h-20 w-28 rounded-sm object-cover shadow-warm"
                />
              ) : (
                <div className="flex h-20 w-28 items-center justify-center rounded-sm bg-muted shadow-warm">
                  <span className="text-foreground/40 text-xs">Sin foto</span>
                </div>
              )}
              <div>
                <p className="text-[11px] uppercase tracking-wider text-foreground/55">
                  Solicitar reserva
                </p>
                <h1 className="text-[28px] leading-tight tracking-tight">{room.name}</h1>
                <p className="text-sm text-foreground/60">
                  ${room.price_per_half_hour} / 30 min · Mínimo 1 hora
                </p>
              </div>
            </div>
            <Stepper step={step} />
          </div>
        </div>
      </div>

      <div className="container-app py-12">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            {step === 1 && (
              <div className="space-y-8">
                <section className="card-surface p-6 sm:p-8">
                  <h2 className="sub-heading">Selecciona fecha y horario</h2>
                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-foreground/55">
                        Fecha
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="mt-2 w-full justify-start font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date
                              ? format(date, "PPP", { locale: es })
                              : "Elige una fecha"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            disabled={(d) => d < new Date(new Date().toDateString())}
                            initialFocus
                            className="pointer-events-auto p-3"
                          />
                        </PopoverContent>
                      </Popover>
                      {date && settings && (() => {
                        const dayName = DAYS_OF_WEEK[date.getDay()];
                        const range = settings.hours_per_day[dayName];
                        if (!range || range.length < 2) return null;
                        const open = `${String(range[0]).padStart(2, "0")}:00`;
                        const close = `${String(range[1]).padStart(2, "0")}:00`;
                        return (
                          <p className="mt-1.5 text-xs text-foreground/50">
                            Horario del estudio: {open} a {close}
                          </p>
                        );
                      })()}
                    </div>

                    <div>
                      <Label className="text-xs uppercase tracking-wider text-foreground/55">
                        Hora de inicio
                      </Label>
                      <Select value={start} onValueChange={setStart} disabled={!date}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder={date ? "Elige horario" : "Elige una fecha primero"} />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.length === 0 && (
                            <div className="px-3 py-6 text-center text-sm text-foreground/60">
                              No hay horarios disponibles para este día
                            </div>
                          )}
                          {timeSlots.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs uppercase tracking-wider text-foreground/55">
                        Duración
                      </Label>
                      <Select
                        value={String(halves)}
                        onValueChange={(v) => setHalves(Number(v))}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 23 }, (_, i) => i + MIN_RESERVATION_HALF_HOURS).map(
                            (h) => (
                              <SelectItem key={h} value={String(h)}>
                                {minutesToLabel(h * 30)}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs uppercase tracking-wider text-foreground/55">
                        Hora de fin
                      </Label>
                      <div className="mt-2 flex h-10 items-center gap-2 rounded-md border border-input bg-cream/40 px-3 text-sm">
                        <Clock className="h-4 w-4 text-foreground/50" />
                        <span className="tabular-nums">{date && start ? end : "—"}</span>
                      </div>
                    </div>
                  </div>

                  {tooShort && (
                    <p className="mt-4 text-sm text-destructive">
                      La duración mínima es de 1 hora.
                    </p>
                  )}
                  {closesAfter && (
                    <p className="mt-4 text-sm text-destructive">
                      El horario seleccionado supera el horario del estudio. Elegí otro horario o
                      reducí la duración.
                    </p>
                  )}

                  <p className="mt-4 text-xs text-foreground/50">
                    La disponibilidad se verifica al enviar la solicitud. Si hay conflicto de
                    horario, te lo notificaremos.
                  </p>
                </section>
              </div>
            )}

            {step === 2 && (
              <section className="card-surface p-6 sm:p-8">
                <h2 className="sub-heading">Añade equipo a tu sesión (opcional)</h2>
                <p className="mt-2 text-sm text-foreground/60">
                  Estos ítems no están incluidos en la sala. Podés saltarte este paso si no
                  necesitas nada extra.
                </p>

                {itemsLoading ? (
                  <div className="mt-6 space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : grouped.length === 0 ? (
                  <div className="mt-8 text-center">
                    <p className="text-sm text-foreground/60">
                      No hay equipo extra disponible para agregar a esta sala.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6">
                    <Accordion type="multiple" defaultValue={[grouped[0]?.[0]]}>
                      {grouped.map(([cat, list]) => (
                        <AccordionItem key={cat} value={cat} className="border-foreground/10">
                          <AccordionTrigger className="hover:no-underline">
                            <span className="flex items-center gap-3">
                              <span className="chip-primary">{cat}</span>
                              <span className="text-sm text-foreground/60">{list.length} items</span>
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <ul className="divide-y divide-border">
                              {list.map((it) => {
                                const qty = extras[it.id] ?? 0;
                                const itemPhoto = it.photos?.[0] ?? "";
                                return (
                                  <li key={it.id} className="flex items-center gap-4 py-4">
                                    <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-sm bg-cream">
                                      {itemPhoto ? (
                                        <img src={itemPhoto} alt={it.name} className="h-full w-full object-cover" />
                                      ) : (
                                        <span className="block h-6 w-6 gradient-block" aria-hidden />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium">{it.name}</p>
                                      <p className="text-xs text-foreground/55">
                                        ${it.price_addon} / hora · disponibles {it.quantity}
                                      </p>
                                    </div>
                                    {qty === 0 ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={it.quantity === 0}
                                        onClick={() => setQty(it.id, 1)}
                                      >
                                        Añadir
                                      </Button>
                                    ) : (
                                      <div className="inline-flex items-center gap-1 rounded-sm border border-foreground/15">
                                        <button
                                          onClick={() => setQty(it.id, qty - 1)}
                                          className="grid h-8 w-8 place-items-center hover:bg-foreground/5"
                                        >
                                          <Minus className="h-3.5 w-3.5" />
                                        </button>
                                        <span className="min-w-[1.5rem] text-center text-sm tabular-nums">
                                          {qty}
                                        </span>
                                        <button
                                          onClick={() => setQty(it.id, qty + 1)}
                                          className="grid h-8 w-8 place-items-center hover:bg-foreground/5"
                                        >
                                          <Plus className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}
              </section>
            )}

            {step === 3 && (
              <section className="card-surface p-6 sm:p-8">
                <h2 className="sub-heading">Confirma tu solicitud</h2>

                <div className="mt-6 space-y-5 text-sm">
                  <div className="flex items-start justify-between border-b border-border pb-4">
                    <span className="text-foreground/60">Sala</span>
                    <span className="font-medium">{room.name}</span>
                  </div>
                  <div className="flex items-start justify-between border-b border-border pb-4">
                    <span className="text-foreground/60">Fecha</span>
                    <span className="font-medium">
                      {date ? format(date, "PPP", { locale: es }) : "—"}
                    </span>
                  </div>
                  <div className="flex items-start justify-between border-b border-border pb-4">
                    <span className="text-foreground/60">Horario</span>
                    <span className="font-medium tabular-nums">
                      {start} – {end}
                    </span>
                  </div>
                  <div className="flex items-start justify-between border-b border-border pb-4">
                    <span className="text-foreground/60">Duración</span>
                    <span className="font-medium">{minutesToLabel(halves * 30)}</span>
                  </div>

                  <div>
                    <Label
                      htmlFor="band"
                      className="text-xs uppercase tracking-wider text-foreground/55"
                    >
                      Nombre de banda (opcional)
                    </Label>
                    <Input
                      id="band"
                      value={bandName}
                      onChange={(e) => setBandName(e.target.value)}
                      placeholder="Ej: Los Reyes del Norte"
                      className="mt-2"
                    />
                  </div>

                  {activeExtras.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wider text-foreground/55">
                        Equipo extra
                      </p>
                      <ul className="mt-2 divide-y divide-border rounded-sm border border-border">
                        {activeExtras.map(({ item, qty }) => (
                          <li
                            key={item.id}
                            className="flex items-center justify-between px-4 py-3"
                          >
                            <span>
                              {item.name}{" "}
                              <span className="text-foreground/50">×{qty}</span>
                            </span>
                            <span className="tabular-nums">${item.price_addon * qty}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="rounded-sm bg-cream/60 p-5">
                    <div className="flex justify-between text-sm text-foreground/70">
                      <span>
                        Sala ({halves} × ${room.price_per_half_hour})
                      </span>
                      <span className="tabular-nums">${roomTotal}</span>
                    </div>
                    {extrasTotal > 0 && (
                      <div className="mt-2 flex justify-between text-sm text-foreground/70">
                        <span>Equipo extra</span>
                        <span className="tabular-nums">${extrasTotal}</span>
                      </div>
                    )}
                    <div className="mt-4 flex items-baseline justify-between border-t border-foreground/10 pt-4">
                      <span className="text-[11px] uppercase tracking-wider text-foreground/55">
                        Total estimado
                      </span>
                      <span className="text-[24px] font-medium tabular-nums">
                        ${total}
                      </span>
                    </div>
                  </div>

                  {createError && (
                    <p className="text-sm text-destructive">{createError}</p>
                  )}
                </div>
              </section>
            )}

            {/* Bottom nav */}
            <div className="mt-8 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => (step === 1 ? navigate(-1) : setStep(step - 1))}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />{" "}
                {step === 1 ? "Cancelar" : "Atrás"}
              </Button>
              {step < 3 ? (
                <div className="flex gap-2">
                  {step === 2 && (
                    <Button variant="outline" onClick={() => setStep(3)}>
                      Saltar
                    </Button>
                  )}
                  <Button
                    variant="cta"
                    disabled={
                      (step === 1 && (!date || !start || tooShort || closesAfter || timeSlots.length === 0))
                    }
                    onClick={() => setStep(step + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              ) : (
                <Button
                  variant="cta"
                  disabled={isCreating}
                  onClick={handleSubmit}
                >
                  {isCreating ? "Enviando..." : "Enviar solicitud"}
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar summary */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <div className="overflow-hidden rounded-sm border border-border bg-card shadow-warm">
                <div className="border-b border-border p-6">
                  <p className="text-[11px] uppercase tracking-wider text-foreground/55">
                    Resumen
                  </p>
                  <p className="mt-2 text-[15px] font-medium">{room.name}</p>
                  {date && start && (
                    <p className="mt-1 text-sm text-foreground/60">
                      {format(date, "EEE d 'de' MMM", { locale: es })} · {start}–{end}
                    </p>
                  )}
                </div>
                <div className="space-y-2 p-6 text-sm">
                  <div className="flex justify-between text-foreground/70">
                    <span>Sala</span>
                    <span className="tabular-nums">${roomTotal}</span>
                  </div>
                  <div className="flex justify-between text-foreground/70">
                    <span>
                      Extras ({Object.values(extras).reduce((a, b) => a + b, 0)})
                    </span>
                    <span className="tabular-nums">${extrasTotal}</span>
                  </div>
                </div>
                <div className="flex items-baseline justify-between border-t border-border bg-cream px-6 py-4">
                  <span className="text-[11px] uppercase tracking-wider text-foreground/55">
                    Total
                  </span>
                  <span className="text-[22px] font-medium tabular-nums">${total}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
};

export default RequestReservation;
