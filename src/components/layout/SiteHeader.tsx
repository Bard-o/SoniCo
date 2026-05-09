import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const SiteHeader = () => {
  const { user, profile, isLoading, signOut } = useAuth();

  const navItem = ({ isActive }: { isActive: boolean }) =>
    `text-sm transition-colors ${
      isActive ? "text-foreground" : "text-foreground/60 hover:text-foreground"
    }`;

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Don't show auth UI until profile is resolved — avoids "??" flash
  const showAuth = !isLoading && user && profile;
  const initials = profile?.full_name ? getInitials(profile.full_name) : "??";
  const fullName = profile?.full_name ?? "Usuario";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-md">
      <div className="container-app flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="block h-7 w-7 gradient-block" aria-hidden />
          <span className="text-[18px] tracking-tight">SoniCo</span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {user && profile ? (
            profile.role === "owner" ? (
              <>
                <NavLink to="/owner" end className={navItem}>Dashboard</NavLink>
                <NavLink to="/owner/pending" className={navItem}>Pendientes</NavLink>
                <NavLink to="/rooms" className={navItem}>Salas</NavLink>
                <NavLink to="/owner/items" className={navItem}>Inventario</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/app/reservations" className={navItem}>Mis reservas</NavLink>
                <NavLink to="/rooms" className={navItem}>Salas</NavLink>
                <NavLink to="/equipment" className={navItem}>Alquiler de equipo</NavLink>
              </>
            )
          ) : (
            <>
              <NavLink to="/rooms" className={navItem}>Salas</NavLink>
              <NavLink to="/equipment" className={navItem}>Alquiler de equipo</NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : user && profile ? (
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
                    {profile?.role === "owner" ? "Propietario del estudio" : "Músico"}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={profile?.role === "owner" ? "/owner" : "/app/reservations"}>Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" /> Mi perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/login">Iniciar sesión</Link>
              </Button>
              <Button asChild variant="cta" size="sm">
                <Link to="/register">Crear cuenta</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
