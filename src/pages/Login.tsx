import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard, GoogleButton, Divider } from "@/components/auth/AuthCard";
import { supabase } from "@/lib/supabase";

const Login = () => {
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (signInError) {
      console.error("[Login] SignIn error:", signInError.message);
      if (signInError.message.includes("Invalid login credentials")) {
        setError("Correo o contraseña inválidos.");
      } else {
        setError(signInError.message);
      }
      return;
    }

    // AuthContext.onAuthStateChange handles role-based redirect to /app or /owner
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/login`,
      },
    });
    if (oauthError) {
      console.error("Google OAuth error:", oauthError);
      setError(oauthError.message);
    }
  };

  return (
    <AuthCard
      title="Bienvenido de vuelta"
      subtitle="Inicia sesión para gestionar tus reservas y alquileres."
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
            Regístrate
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@correo.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link to="#" className="text-xs text-foreground/70 hover:text-foreground hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPwd ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className="pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-foreground/60 hover:text-foreground"
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" variant="cta" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
        </Button>
      </form>

      <Divider />
      <GoogleButton label="Continuar con Google" onClick={handleGoogleSignIn} />
    </AuthCard>
  );
};

export default Login;
