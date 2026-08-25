import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import type { Room } from "@/types/database";

interface RoomCardProps {
  room: {
    id: string;
    slug: string;
    name: string;
    description?: string;
    photos?: string[];
    price_per_half_hour?: number;
    is_active?: boolean;
  };
}

// Adapter: maps old seed-based Room fields to new DB Room fields
function toCardRoom(room: RoomCardProps["room"]) {
  return {
    slug: room.slug,
    name: room.name,
    image: room.photos?.[0] ?? "",
    shortDescription:
      room.description.length > 120
        ? `${room.description.slice(0, 120)}…`
        : room.description,
    pricePerHalfHour: room.price_per_half_hour,
    available: room.is_active,
    categories: [] as string[],
  };
}

export const RoomCard = ({ room }: RoomCardProps) => {
  const r = toCardRoom(room);

  return (
    <Link
      to={`/rooms/${r.slug}`}
      className="group block card-interactive overflow-hidden bg-card"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {r.image ? (
          <img
            src={r.image}
            alt={r.name}
            loading="lazy"
            width={1280}
            height={896}
            className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-foreground/30 text-sm">Sin foto</div>
        )}
        {!r.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/55 backdrop-blur-[2px]">
            <span className="rounded-sm bg-background px-3 py-1.5 text-[11px] uppercase tracking-wider">
              Actualmente no disponible
            </span>
          </div>
        )}
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-baseline gap-1 rounded-sm bg-background px-2.5 py-1.5 text-xs">
            <span className="text-foreground">${r.pricePerHalfHour}</span>
            <span className="text-foreground/60">/ 30 min</span>
          </span>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[20px] leading-tight tracking-tight">{r.name}</h3>
          <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-foreground/40 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
        {r.shortDescription && (
          <p className="mt-2 line-clamp-2 text-sm text-foreground/65">
            {r.shortDescription}
          </p>
        )}
      </div>
    </Link>
  );
};
