import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface BookingButtonProps {
  room: {
    slug: string;
    is_active: boolean;
  };
}

export const BookingButton = ({ room }: BookingButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!room.is_active) {
    return (
      <Button size="lg" variant="cta" className="w-full" disabled>
        No disponible
      </Button>
    );
  }

  if (!user) {
    return (
      <Button
        size="lg"
        variant="cta"
        className="w-full"
        onClick={() => navigate("/login")}
      >
        Inicia sesión para reservar
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      variant="cta"
      className="w-full"
      onClick={() => navigate(`/rooms/${room.slug}/reserve`)}
    >
      Reservar
    </Button>
  );
};