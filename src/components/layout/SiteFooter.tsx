import { Instagram, Youtube } from "lucide-react";

export const SiteFooter = () => (
  <footer className="border-t border-border bg-cream">
    <div className="container-app py-16">
      <div className="grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="block h-7 w-7 gradient-block" aria-hidden />
            <span className="text-[18px] tracking-tight">SoniCo</span>
          </div>
          <p className="mt-5 max-w-sm text-sm text-foreground/70 leading-relaxed">
            Salas de ensayo y alquiler de equipo para músicos. Reserva online, toca sin fricciones.
          </p>
        </div>
        <div>
          <p className="eyebrow mb-4">Estudio</p>
          <p className="text-sm">Lun – Dom · 9:00 – 23:00</p>
          <p className="mt-1 text-sm text-foreground/70">Calle Resonancia 12, Madrid</p>
        </div>
        <div>
          <p className="eyebrow mb-4">Síguenos</p>
          <div className="flex gap-2">
            <a href="#" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-sm border border-foreground/15 transition-colors hover:bg-foreground hover:text-background">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" aria-label="YouTube" className="flex h-10 w-10 items-center justify-center rounded-sm border border-foreground/15 transition-colors hover:bg-foreground hover:text-background">
              <Youtube className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
      <div className="mt-12 flex flex-col items-start justify-between gap-2 border-t border-foreground/10 pt-6 text-xs text-foreground/60 sm:flex-row">
        <p>© {new Date().getFullYear()} SoniCo Studios.</p>
        <div className="flex gap-5">
          <a href="#" className="hover:text-foreground">Privacidad</a>
          <a href="#" className="hover:text-foreground">Términos</a>
        </div>
      </div>
    </div>
  </footer>
);
