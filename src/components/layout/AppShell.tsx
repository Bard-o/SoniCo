import { Link, NavLink, useNavigate } from "react-router-dom";
import { ReactNode, useState } from "react";
import { AlertTriangle, Bell, ChevronDown, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export type AppNotification = {
  id: string;
  title: string;
  time: string;
  unread: boolean;
  type: "reservation" | "rental" | "system";
};

const sampleNotifications: AppNotification[] = [
  { id: "1", title: "Tu reserva en Studio A fue confirmada.", time: "hace 2 horas", unread: true, type: "reservation" },
  { id: "2", title: "Nueva solicitud pendiente de revisión.", time: "hace 5 horas", unread: true, type: "rental" },
  { id: "3", title: "Recordatorio: ensayo mañana a las 18:00.", time: "ayer", unread: false, type: "system" },
];

type NavItem = { to: string; label: string; end?: boolean; badge?: number };

const userLinks: NavItem[] = [
  { to: "/app", label: "Salas", end: true },
  { to: "/app/equipment", label: "Alquiler de equipo" },
  { to: "/app/reservations", label: "Mis reservas" },
  { to: "/app/rentals", label: "Mis alquileres" },
];

const ownerLinks: NavItem[] = [
  { to: "/owner", label: "Dashboard", end: true },
  { to: "/owner/pending", label: "Pendientes", badge: 4 },
  { to: "/owner/calendar", label: "Calendario" },
  { to: "/owner/reservations", label: "Reservas" },
  { to: "/owner/rentals", label: "Alquileres" },
  { to: "/owner/rooms", label: "Salas" },
  { to: "/owner/items", label: "Inventario" },
  { to: "/owner/settings", label: "Ajustes" },
];

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const AppShell = ({
  role = "user",
  children,
}: {
  role?: "user" | "owner";
  children: ReactNode;
}) => {
  const navigate = useNavigate();
  const { profile, signOut, isLoading, error } = useAuth();
  const [notifications, setNotifications] = useState(sampleNotifications);
  const unreadCount = notifications.filter((n) => n.unread).length;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-foreground/60">Cargando…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <p className="max-w-sm text-sm text-foreground/80">
            {error || "No se pudo cargar el perfil. Intenta recargar la página."}
          </p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Recargar
          </Button>
        </div>
      </div>
    );
  }

  const currentRole = profile.role ?? role;
  const links = currentRole === "owner" ? ownerLinks : userLinks;

  const initials = getInitials(profile.full_name);
  const fullName = profile.full_name;

  const navItem = ({ isActive }: { isActive: boolean }) =>
    cn(
      "relative whitespace-nowrap text-sm transition-colors",
      isActive ? "text-foreground" : "text-foreground/60 hover:text-foreground",
    );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-md">
        <div className="container-app flex h-16 items-center gap-8">
          <Link to={currentRole === "owner" ? "/owner" : "/app"} className="flex items-center gap-2.5">
            <span className="block h-7 w-7 gradient-block" aria-hidden />
            <span className="text-[18px] tracking-tight">SoniCo</span>
            {currentRole === "owner" && (
              <span className="ml-2 rounded-sm border border-foreground/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-foreground/70">
                Owner
              </span>
            )}
          </Link>

          <nav className="hidden flex-1 items-center gap-7 overflow-x-auto md:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={navItem}>
                <span className="inline-flex items-center gap-2">
                  {l.label}
                  {"badge" in l && l.badge ? (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">
                      {l.badge}
                    </span>
                  ) : null}
                </span>
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  aria-label="Notificaciones"
                  className="relative flex h-10 w-10 items-center justify-center rounded-sm text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute right-2 top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <p className="text-sm font-medium">Notificaciones</p>
                  <button
                    onClick={() => setNotifications((ns) => ns.map((n) => ({ ...n, unread: false })))}
                    className="text-xs text-foreground/70 hover:text-foreground hover:underline"
                  >
                    Marcar todas como leídas
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-foreground/60">
                      No hay notificaciones.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          "flex gap-3 border-b border-border/60 px-4 py-3 last:border-0",
                          n.unread && "bg-secondary/40",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                            n.unread ? "bg-primary" : "bg-transparent",
                          )}
                        />
                        <div className="min-w-0">
                          <p className={cn("text-sm leading-snug", n.unread && "font-medium")}>{n.title}</p>
                          <p className="mt-0.5 text-xs text-foreground/55">{n.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-sm px-1.5 py-1 text-sm hover:bg-foreground/5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-xs font-medium text-background">
                    {initials}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-foreground/60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{fullName}</p>
                  <p className="text-xs font-normal text-foreground/60">
                    {currentRole === "owner" ? "Propietario del estudio" : "Músico"}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" /> Mi perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-border">
        <div className="container-app flex h-14 items-center justify-between text-xs text-foreground/55">
          <p>© {new Date().getFullYear()} SoniCo Studios.</p>
          <p>Hecho con cariño para músicos.</p>
        </div>
      </footer>
    </div>
  );
};

export const StatusBadge = ({ status }: { status: "pending" | "confirmed" | "denied" | "cancelled" }) => {
  const map = {
    pending: { label: "Pendiente", cls: "bg-warning-soft text-foreground" },
    confirmed: { label: "Confirmada", cls: "bg-success-soft text-foreground" },
    denied: { label: "Denegada", cls: "bg-destructive/10 text-destructive" },
    cancelled: { label: "Cancelada", cls: "bg-muted text-foreground/60" },
  } as const;
  const s = map[status];
  return (
    <span className={cn("inline-flex items-center rounded-sm px-2 py-1 text-[11px] font-medium uppercase tracking-wider", s.cls)}>
      {s.label}
    </span>
  );
};

export { Button };
