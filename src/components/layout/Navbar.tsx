import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Menu, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; end?: boolean };

const publicLinks: NavItem[] = [
  { to: "/rooms", label: "Salas" },
  { to: "/equipment", label: "Alquiler de equipo" },
];

const userLinks: NavItem[] = [
  { to: "/app/reservations", label: "Mis reservas" },
  { to: "/rooms", label: "Salas" },
  { to: "/equipment", label: "Alquiler de equipo" },
];

const ownerLinks: NavItem[] = [
  { to: "/owner", label: "Dashboard", end: true },
  { to: "/owner/pending", label: "Pendientes" },
  { to: "/rooms", label: "Salas" },
  { to: "/owner/items", label: "Inventario" },
];

const getInitials = (name: string): string =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export const Navbar = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isOwner = profile?.role === "owner";
  const links = !user || !profile ? publicLinks : isOwner ? ownerLinks : userLinks;
  const initials = profile?.full_name ? getInitials(profile.full_name) : "??";
  const fullName = profile?.full_name ?? "Usuario";

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "relative whitespace-nowrap text-sm transition-colors",
      isActive ? "text-foreground font-medium" : "text-foreground/60 hover:text-foreground",
    );

  const renderNavLinks = (mobile = false) =>
    links.map((l) => (
      <NavLink
        key={l.to}
        to={l.to}
        end={l.end}
        onClick={() => setMobileOpen(false)}
        className={mobile ? "text-sm text-foreground/70 hover:text-foreground" : navItemClass}
      >
        {l.label}
      </NavLink>
    ));

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-md">
      <div className="container-app flex h-16 items-center">
        {/* Logo — always left */}
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <span className="block h-7 w-7 gradient-block" aria-hidden />
          <span className="text-[18px] tracking-tight">SoniCo</span>
        </Link>

        {/* Nav links — centered on desktop */}
        <nav className="mx-auto hidden items-center gap-9 md:flex">{renderNavLinks()}</nav>

        {/* Spacer to balance logo on mobile */}
        <div className="md:hidden" />

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : user && profile ? (
            /* Authenticated: profile dropdown (desktop nav inside on mobile) */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-sm px-1.5 py-1 text-sm hover:bg-foreground/5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-xs font-medium text-background">
                    {initials}
                  </span>
                  <ChevronDown className="hidden h-3.5 w-3.5 text-foreground/60 sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{fullName}</p>
                  <p className="text-xs font-normal text-foreground/60">
                    {isOwner ? "Propietario del estudio" : "Músico"}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Mobile: nav items inside profile dropdown */}
                <div className="md:hidden">
                  {links.map((l) => (
                    <DropdownMenuItem key={l.to} asChild>
                      <NavLink to={l.to} end={l.end}>{l.label}</NavLink>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </div>
                <DropdownMenuItem asChild>
                  <Link to={isOwner ? "/owner" : "/app/reservations"}>Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* Not authenticated: login/register on desktop, hamburger on mobile */
            <>
              <div className="hidden items-center gap-2 sm:flex">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Iniciar sesión</Link>
                </Button>
                <Button asChild variant="cta" size="sm">
                  <Link to="/register">Crear cuenta</Link>
                </Button>
              </div>
              {/* Mobile hamburger */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="sm:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64 p-6">
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2.5">
                        <span className="block h-6 w-6 gradient-block" aria-hidden />
                        <span className="text-base tracking-tight">SoniCo</span>
                      </span>
                      <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <nav className="flex flex-col gap-4">{renderNavLinks(true)}</nav>
                    <div className="flex flex-col gap-2">
                      <Button asChild variant="outline" size="sm" onClick={() => setMobileOpen(false)}>
                        <Link to="/login">Iniciar sesión</Link>
                      </Button>
                      <Button asChild variant="cta" size="sm" onClick={() => setMobileOpen(false)}>
                        <Link to="/register">Crear cuenta</Link>
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
