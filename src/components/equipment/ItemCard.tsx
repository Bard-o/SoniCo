import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import type { RentalItem } from "@/types/database";

interface ItemCardProps {
  item: RentalItem;
}

export const ItemCard = ({ item }: ItemCardProps) => {
  const { lines, add, setQty } = useCart();
  const line = lines.find((l) => l.itemId === item.id);

  return (
    <article className="group flex flex-col overflow-hidden rounded-sm border border-border bg-card transition-all duration-300 hover:shadow-[var(--shadow-md)]">
      <Link to={`/equipment/${item.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden gradient-warm">
          {item.photos?.[0] ? (
            <img
              src={item.photos[0]}
              alt={item.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="block h-16 w-16 gradient-block opacity-90" aria-hidden />
            </div>
          )}
          <span className="absolute left-3 top-3 inline-flex items-center rounded-sm bg-background/90 px-2 py-1 text-[11px] uppercase tracking-wider text-foreground/70 backdrop-blur-sm">
            {item.category}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <Link to={`/equipment/${item.id}`} className="block">
            <h3 className="text-[17px] font-medium leading-tight tracking-tight transition-colors group-hover:text-primary">
              {item.name}
            </h3>
          </Link>
          <p className="mt-1.5 line-clamp-2 text-[13px] text-foreground/60">{item.description}</p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-foreground/50">Por alquiler</p>
            <p className="text-[20px] font-medium leading-none tracking-tight">${item.price_rental.toLocaleString("es-AR")}</p>
          </div>

          {!line ? (
            <Button size="sm" variant="cta" onClick={() => add(item.id)}>
              <Plus className="h-3.5 w-3.5" /> Añadir
            </Button>
          ) : (
            <div className="inline-flex items-center gap-1 rounded-sm border border-foreground/20 bg-background">
              <button
                onClick={() => setQty(item.id, line.qty - 1)}
                className="grid h-9 w-9 place-items-center text-foreground/70 transition-colors hover:bg-foreground/5"
                aria-label="Disminuir"
              >
                {line.qty === 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
              </button>
              <span className="min-w-[1.5rem] text-center text-sm tabular-nums">{line.qty}</span>
              <button
                onClick={() => setQty(item.id, line.qty + 1)}
                disabled={line.qty >= item.available_units}
                className="grid h-9 w-9 place-items-center text-foreground/70 transition-colors hover:bg-foreground/5 disabled:pointer-events-none disabled:opacity-40"
                aria-label="Aumentar"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};