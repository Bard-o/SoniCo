import { Fragment, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  CalendarIcon,
  Check,
  ChevronRight,
  Clock,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useCart, useCartDetailed } from "@/contexts/CartContext";
import { useRentalItems } from "@/hooks/useRentalItems";
import { useStudioSettings } from "@/hooks/useStudioSettings";
import { useCreateRental } from "@/hooks/useCreateRental";
import { cn } from "@/lib/utils";
import { MIN_RENTAL_HOURS, MAX_RENTAL_HOURS } from "@/config/constants";

const STEPS = ["Carrito y horario", "Detalles y confirmar"];

const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

const DAYS_OF_WEEK = [
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
] as const;

function generateTimeSlots(openHour: number, closeHour: number): string[] {
  const slots: string[] = [];
  for (let h = openHour; h < closeHour; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
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
              <span className={cn("hidden text-sm sm:inline", active ? "text-foreground" : "text-foreground/55")}>
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

function buildDate(d: Date | undefined, time: string): Date | null {
  if (!d) return null;
  const [h, m] = time.split(":").map(Number);
  const out = new Date(d);
  out.setHours(h, m, 0, 0);
  return out;
}

const RequestRental = () => {
  const navigate = useNavigate();
  const { setQty, remove, count, clear } = useCart();
  const { items: catalog, isLoading: catalogLoading } = useRentalItems();
  const detailed = useCartDetailed(catalog);
  const { settings, isLoading: settingsLoading } = useStudioSettings();
  const { createRental, isCreating, error: createError } = useCreateRental();

  const [step, setStep] = useState(1);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endTime, setEndTime] = useState("");
  const [bandName, setBandName] = useState("");
  const [details, setDetails] = useState("");

  // Compute studio hours for selected day
  const daySlots = useMemo(() => {
    if (!settings || !startDate) return [];
    const dayName = DAYS_OF_WEEK[startDate.getDay()];
    const range = settings.hours_per_day[dayName];
    if (!range || range.length < 2) return [];
    return generateTimeSlots(range[0], range[1]);
  }, [settings, startDate]);

  // Auto-select first slot when day changes
  useMemo(() => {
    if (daySlots.length > 0 && !daySlots.includes(startTime)) {
      setStartTime(daySlots[0]);
    }
  }, [daySlots, startTime]);

  const startAt = useMemo(() => buildDate(startDate, startTime), [startDate, startTime]);
  const endAt = useMemo(() => buildDate(endDate, endTime), [endDate, endTime]);

  const minutes = startAt && endAt ? differenceInMinutes(endAt, startAt) : 0;
  const hours = minutes / 60;
  const tooShort = hours > 0 && hours < MIN_RENTAL_HOURS;
  const tooLong = hours > MAX_RENTAL_HOURS;
  const noStart = !startDate || !startTime;
  const noEnd = !endDate || !endTime;
  const empty = count === 0;
  const subtotal = detailed.reduce((a, l) => a + l.lineTotal, 0);
  const totalEstimated = subtotal * (hours > 0 ? hours : 0);

  // Empty cart state
  if (empty) {
    return (
      <AppShell role="user">
        <div className="container-app flex min-h-[60vh] items-center justify-center py-16">
          <div className="card-surface max-w-md p-10 text-center">
            <h1 className="sub-heading">Tu carro está vacío</h1>
            <p className="mt-3 text-sm text-foreground/60">
              Añadí equipo del catálogo para crear una solicitud de alquiler.
            </p>
            <Button asChild variant="cta" className="mt-6">
              <Link to="/equipment">Ir al catálogo</Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const loading = catalogLoading || settingsLoading;

  if (loading) {
    return (
      <AppShell role="user">
        <div className="container-app flex min-h-[60vh] items-center justify-center py-16">
          <p className="text-sm text-foreground/60">Cargando…</p>
        </div>
      </AppShell>
    );
  }

  const canProceedToStep2 =
    !noStart && !noEnd && !tooShort && !tooLong && hours >= MIN_RENTAL_HOURS;


  // Handle confirm
  const handleConfirm = async () => {
    if (!startAt || !endAt) return;

    const items = detailed.map(({ item, qty }) => ({
      item_id: item.id,
      quantity: qty,
      unit_price: item.price_rental,
    }));

    const result = await createRental({
      band_or_event_name: bandName || undefined,
      details: details || undefined,
      start_datetime: startAt.toISOString(),
      end_datetime: endAt.toISOString(),
      total_price: totalEstimated,
      items,
    });

    if (result) {
      clear();
      navigate("/app");
    }
  };

  return (
    <AppShell role="user">
      {/* Hero */}
      <div className="gradient-warm border-b border-border">
        <div className="container-app py-8">
          <Link
            to="/equipment"
            className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al catálogo
          </Link>
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-foreground/55">
                Solicitar alquiler
              </p>
              <h1 className="text-[28px] leading-tight tracking-tight">
                {count} {count === 1 ? "ítem" : "ítems"} en tu solicitud
              </h1>
              <p className="text-sm text-foreground/60">
                Mínimo {MIN_RENTAL_HOURS} horas, máximo {MAX_RENTAL_HOURS} horas de alquiler.
              </p>
            </div>
            <Stepper step={step} />
          </div>
        </div>
      </div>

      <div className="container-app py-12">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Main content */}
          <div className="lg:col-span-8">
            {step === 1 && (
              <div className="space-y-8">
                {/* Cart summary */}
                <section className="card-surface p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <h2 className="sub-heading">Tu carro</h2>
                    <button onClick={clear} className="text-xs text-foreground/55 underline-offset-4 hover:underline">
                      Vaciar
                    </button>
                  </div>
                  <ul className="mt-5 divide-y divide-border">
                    {detailed.map(({ item, qty, lineTotal }) => (
                      <li key={item.id} className="flex items-center gap-4 py-4">
                        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-sm bg-cream">
                          {item.photos?.[0] ? (
                            <img src={item.photos[0]} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="block h-6 w-6 gradient-block" aria-hidden />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-foreground/55">${item.price_rental.toLocaleString("es-AR")} / hora</p>
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-sm border border-foreground/15">
                          <button
                            onClick={() => setQty(item.id, qty - 1)}
                            className="grid h-8 w-8 place-items-center hover:bg-foreground/5"
                          >
                            {qty === 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                          </button>
                          <span className="min-w-[1.5rem] text-center text-sm tabular-nums">{qty}</span>
                          <button
                            onClick={() => setQty(item.id, qty + 1)}
                            disabled={qty >= item.available_units}
                            className="grid h-8 w-8 place-items-center hover:bg-foreground/5 disabled:opacity-40"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="w-20 text-right">
                          <p className="text-sm font-medium tabular-nums">${lineTotal.toLocaleString("es-AR")}</p>
                          <button
                            onClick={() => remove(item.id)}
                            className="text-[11px] text-foreground/50 hover:text-destructive"
                          >
                            Quitar
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Date & time */}
                <section className="card-surface p-6 sm:p-8">
                  <h2 className="sub-heading">Fechas y horario</h2>
                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    {/* Start date */}
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-foreground/55">Inicio — fecha</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="mt-2 w-full justify-start font-normal">
                            <CalendarIcon className="h-4 w-4" />
                            {startDate ? format(startDate, "PPP", { locale: es }) : "Elegí una fecha"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={(d) => {
                              setStartDate(d);
                              // Auto-set end date to same day initially
                              if (d && !endDate) {
                                setEndDate(d);
                              }
                            }}
                            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Start time */}
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-foreground/55">Inicio — hora</Label>
                      <Select
                        value={startTime}
                        onValueChange={(v) => {
                          setStartTime(v);
                          // Auto-set end time to 3h later if not set
                          if (!endTime) setEndTime(v);
                        }}
                      >
                        <SelectTrigger className="mt-2"><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                          {daySlots.length === 0 ? (
                            <SelectItem value="-" disabled>
                              {startDate ? "No hay horarios disponibles" : "Elegí una fecha primero"}
                            </SelectItem>
                          ) : (
                            daySlots.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* End date */}
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-foreground/55">Fin — fecha</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="mt-2 w-full justify-start font-normal">
                            <CalendarIcon className="h-4 w-4" />
                            {endDate ? format(endDate, "PPP", { locale: es }) : "Elegí una fecha"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            disabled={(d) => startDate ? d < startDate : d < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* End time */}
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-foreground/55">Fin — hora</Label>
                      <Select value={endTime} onValueChange={setEndTime}>
                        <SelectTrigger className="mt-2"><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                          {TIMES.map((t) => (
                            <SelectItem key={t} value={t} disabled={startTime ? t <= startTime && endDate <= startDate : false}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Duration display */}
                    <div className="md:col-span-2">
                      <div className="flex h-11 items-center gap-2 rounded-md border border-input bg-cream/40 px-3 text-sm">
                        <Clock className="h-4 w-4 text-foreground/50" />
                        <span className="text-foreground/60">Duración:</span>
                        <span className="font-medium tabular-nums">
                          {hours > 0
                            ? `${Number.isInteger(hours) ? hours : hours.toFixed(1)} ${hours === 1 ? "hora" : "horas"}`
                            : "—"}
                        </span>
                      </div>
                      {(tooShort || tooLong) && (
                        <p className="mt-2 text-sm text-destructive">
                          {tooShort
                            ? `El alquiler debe durar al menos ${MIN_RENTAL_HOURS} horas.`
                            : `El alquiler no puede superar ${MAX_RENTAL_HOURS} horas.`}
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {step === 2 && (
              <section className="card-surface p-6 sm:p-8">
                <h2 className="sub-heading">Detalles del alquiler</h2>

                <div className="mt-6 space-y-5">
                  <div>
                    <Label htmlFor="band" className="text-xs uppercase tracking-wider text-foreground/55">
                      Nombre de banda o evento <span className="text-foreground/40">(opcional)</span>
                    </Label>
                    <Input
                      id="band"
                      value={bandName}
                      onChange={(e) => setBandName(e.target.value)}
                      placeholder="Festival Sonoro 2026"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="details" className="text-xs uppercase tracking-wider text-foreground/55">
                      Detalles <span className="text-foreground/40">(opcional)</span>
                    </Label>
                    <Textarea
                      id="details"
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Fecha del evento, lugar, o cualquier detalle relevante."
                      rows={4}
                      className="mt-2"
                    />
                  </div>

                  {/* Order summary */}
                  <div className="rounded-sm border border-border">
                    <div className="border-b border-border px-5 py-3">
                      <p className="text-[11px] uppercase tracking-wider text-foreground/55">Resumen</p>
                    </div>
                    <ul className="divide-y divide-border">
                      {detailed.map(({ item, qty, lineTotal }) => (
                        <li key={item.id} className="flex items-center justify-between px-5 py-3 text-sm">
                          <span>{item.name} <span className="text-foreground/50">×{qty}</span></span>
                          <span className="tabular-nums">${lineTotal.toLocaleString("es-AR")}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="space-y-2 border-t border-border px-5 py-4 text-sm">
                      <div className="flex justify-between text-foreground/70">
                        <span>Inicio</span>
                        <span className="tabular-nums">
                          {startAt ? format(startAt, "PPP p", { locale: es }) : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between text-foreground/70">
                        <span>Fin</span>
                        <span className="tabular-nums">
                          {endAt ? format(endAt, "PPP p", { locale: es }) : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between text-foreground/70">
                        <span>Duración</span>
                        <span className="tabular-nums">
                          {Number.isInteger(hours) ? `${hours}` : hours.toFixed(1)} horas
                        </span>
                      </div>
                      {bandName && (
                        <div className="flex justify-between text-foreground/70">
                          <span>Evento</span>
                          <span>{bandName}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-baseline justify-between border-t border-border bg-cream px-5 py-4">
                      <span className="text-[11px] uppercase tracking-wider text-foreground/55">Total estimado</span>
                      <span className="text-[22px] font-medium tabular-nums">
                        ${totalEstimated.toLocaleString("es-AR")}
                      </span>
                    </div>
                  </div>

                  {createError && (
                    <div className="rounded-sm border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                      {createError}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Navigation buttons */}
            <div className="mt-8 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => (step === 1 ? navigate(-1) : setStep(step - 1))}
              >
                <ArrowLeft className="h-4 w-4" /> {step === 1 ? "Cancelar" : "Atrás"}
              </Button>
              {step < 2 ? (
                <Button
                  variant="cta"
                  disabled={!canProceedToStep2}
                  onClick={() => setStep(2)}
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  variant="cta"
                  disabled={isCreating}
                  onClick={handleConfirm}
                >
                  {isCreating ? "Enviando…" : "Enviar solicitud"}
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <div className="overflow-hidden rounded-sm border border-border bg-card shadow-warm">
                <div className="border-b border-border p-6">
                  <p className="text-[11px] uppercase tracking-wider text-foreground/55">Resumen</p>
                  <p className="mt-2 text-[15px] font-medium">{count} {count === 1 ? "ítem" : "ítems"}</p>
                  <p className="mt-1 text-sm text-foreground/60">
                    {hours > 0
                      ? `${Number.isInteger(hours) ? hours : hours.toFixed(1)} horas`
                      : "—"}
                  </p>
                </div>
                <ul className="max-h-64 divide-y divide-border overflow-y-auto">
                  {detailed.map(({ item, qty, lineTotal }) => (
                    <li key={item.id} className="flex items-center justify-between px-6 py-3 text-sm">
                      <span className="truncate">{item.name} <span className="text-foreground/50">×{qty}</span></span>
                      <span className="tabular-nums">${lineTotal.toLocaleString("es-AR")}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-baseline justify-between border-t border-border bg-cream px-6 py-4">
                  <span className="text-[11px] uppercase tracking-wider text-foreground/55">Total est.</span>
                  <span className="text-[22px] font-medium tabular-nums">${totalEstimated.toLocaleString("es-AR")}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
};

export default RequestRental;
