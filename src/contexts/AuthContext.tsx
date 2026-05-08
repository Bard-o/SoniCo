import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      setError("Error cargando perfil");
      return null;
    }

    return data;
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Race getSession against a 10s timeout — gotrue-js can hang on clock skew / URL parse
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 10_000));

        const winner = await Promise.race([sessionPromise, timeoutPromise]);

        let currentUserId: string | undefined;

        if (winner && winner.data.session) {
          // Normal path — getSession() resolved
          const currentSession = winner.data.session;
          setSession(currentSession);
          setUser(currentSession.user);
          currentUserId = currentSession.user.id;
        } else {
          // Timeout or null — fall back to localStorage
          console.warn("[AuthContext] getSession() hang or null, falling back to localStorage");
          const raw = localStorage.getItem("sb-rxudtsesweqyywqomcmf-auth-token");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.access_token && parsed.user) {
              setSession({
                access_token: parsed.access_token,
                refresh_token: parsed.refresh_token,
                expires_at: parsed.expires_at,
                expires_in: parsed.expires_in,
                token_type: parsed.token_type,
                user: parsed.user,
              } as Session);
              setUser(parsed.user as User);
              currentUserId = parsed.user.id;
            }
          }
        }

        if (currentUserId) {
          const profileData = await fetchProfile(currentUserId);
          setProfile(profileData);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        setError("Error inicializando autenticación");
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (event === "SIGNED_OUT" || !newSession) {
          setSession(null);
          setUser(null);
          setProfile(null);
          navigate("/login");
        } else if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && newSession) {
          setSession(newSession);
          setUser(newSession.user);
          const profileData = await fetchProfile(newSession.user.id);
          setProfile(profileData);

          // Redirect based on role after fresh login or OAuth callback
          const isAuthPage = ["/login", "/register"].includes(window.location.pathname);
          if (isAuthPage && profileData) {
            navigate(profileData.role === "owner" ? "/owner" : "/app", { replace: true });
          }
        } else if (event === "TOKEN_REFRESHED" && newSession) {
          setSession(newSession);
          setUser(newSession.user);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
      navigate("/login");
    } catch (err) {
      console.error("Sign out error:", err);
      setError("Error cerrando sesión");
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, isLoading, error, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
