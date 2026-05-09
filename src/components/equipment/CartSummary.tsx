import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, useCartDetailed } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import type { RentalItem } from "@/types/database";

interface CartSummaryProps {
  items: RentalItem[];
  compact?: boolean;
}

export const CartSummary = ({ items, compact = false }: CartSummaryProps) => {
  const { user } = useAuth();
  const { count, clear, setQty } = useCart();
  const detailed = useCartDetailed(items);

  const subtotal = detailed.reduce((a, l) => a + l.lineTotal, 0);

  if (count === 0) {
    return (
      <div className="rounded-sm border border-dashed border-border bg-card p-6 text-center">
        <ShoppingBag className="mx-auto mb-3 h-6 w-6 text-foreground/40" />
        <p className="text-sm text-foreground/60">Tu carro está vacío</p>
        <p className="mt-1 text-[12px] text-foreground/50">Añade equipo para crear una solicitud de alquiler.</p>
      </div>
    );
  }

  return (
    <aside className="overflow-hidden rounded-sm border border-border bg-card">
      <header className="flex items-center justify-between border-b border-border bg-cream/40 px-5 py-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-foreground/60">Carro</p>
          <p className="text-[15px] font-medium leading-tight">
            {count} {count === 1 ? "ítem" : "ítems"}
          </p>
        </div>
        <button onClick={clear} className="text-[12px] text-foreground/50 underline-offset-4 hover:underline">
          Vaciar
        </button>
      </header>

      <ul className="divide-y divide-border">
        {detailed.map(({ item, qty, lineTotal }) => (
          <li key={item.id} className="flex items-start gap-3 px-5 py-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-sm bg-cream">
              {item.photos?.[0] ? (
                <img src={item.photos[0]} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <span className="block h-6 w-6 gradient-block" aria-hidden />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-[14px] font-medium leading-tight">{item.name}</p>
              <p className="mt-0.5 text-[12px] text-foreground/55">${item.price_rental.toLocaleString("es-AR")} / hora</p>
              {!compact && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-sm border border-foreground/15">
                  <button
                    onClick={() => setQty(item.id, qty - 1)}
                    className="grid h-7 w-7 place-items-center hover:bg-foreground/5"
                    aria-label="Menos"
                  >
                    {qty === 1 ? <Trash2 className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                  </button>
                  <span className="min-w-[1.25rem] text-center text-[12px] tabular-nums">{qty}</span>
                  <button
                    onClick={() => setQty(item.id, qty + 1)}
                    disabled={qty >= item.available_units}
                    className="grid h-7 w-7 place-items-center hover:bg-foreground/5 disabled:pointer-events-none disabled:opacity-40"
                    aria-label="Más"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-[14px] font-medium tabular-nums">${lineTotal.toLocaleString("es-AR")}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="border-t border-border bg-background px-5 py-4">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-[12px] uppercase tracking-wider text-foreground/60">Subtotal/hora</span>
          <span className="text-[20px] font-medium tabular-nums">${subtotal.toLocaleString("es-AR")}</span>
        </div>
        <Button variant="cta" className="w-full" disabled>
          Solicitar alquiler
        </Button>
        <p className="mt-2 text-center text-[11px] text-foreground/50">
          {user ? "Función próximamente" : "Inicia sesión para solicitar alquiler"}
        </p>
      </div>
    </aside>
  );
};