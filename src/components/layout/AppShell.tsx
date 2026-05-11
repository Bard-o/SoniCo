import { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export const AppShell = ({
  role = "user",
  children,
}: {
  role?: "user" | "owner";
  children: ReactNode;
}) => {
  const { profile, isLoading, error } = useAuth();

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>{children}</main>

      <Footer />
    </div>
  );
};

export const StatusBadge = ({ status, type = "reservation" }: { status: "pending" | "confirmed" | "denied" | "cancelled"; type?: "reservation" | "rental" }) => {
  const labels = type === "rental"
    ? { pending: "Pendiente", confirmed: "Confirmado", denied: "Denegado", cancelled: "Cancelado" }
    : { pending: "Pendiente", confirmed: "Confirmada", denied: "Denegada", cancelled: "Cancelada" };
  const classes = {
    pending: { label: "Pendiente", cls: "bg-warning-soft text-foreground" },
    confirmed: { label: "Confirmada", cls: "bg-success-soft text-foreground" },
    denied: { label: "Denegada", cls: "bg-destructive/10 text-destructive" },
    cancelled: { label: "Cancelada", cls: "bg-muted text-foreground/60" },
  } as const;
  const s = classes[status];
  return (
    <span className={cn("inline-flex items-center rounded-sm px-2 py-1 text-[11px] font-medium uppercase tracking-wider", s.cls)}>
      {labels[status]}
    </span>
  );
};

export { Button };
