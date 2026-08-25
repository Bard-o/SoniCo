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

  // Fetch profile from database — called from a SEPARATE useEffect
  // to avoid async PostgREST calls inside onAuthStateChange callback.
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("[Auth] Profile fetch error:", profileError.message);
        setError("Error cargando perfil");
        return null;
      }

      return data;
    } catch (err) {
      console.error("[Auth] Profile fetch exception:", err);
      setError("Error cargando perfil");
      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Handle OAuth callback: extract tokens from URL hash manually
        // because detectSessionInUrl is false.
        const hash = window.location.hash;
        if (hash && hash.includes("access_token")) {
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");
          if (accessToken && refreshToken) {
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            // setSession/onAuthStateChange will handle the rest
            return; // Skip getSession — setSession triggers INITIAL_SESSION
          }
        }

        // Normal page load (no OAuth hash): read session from localStorage
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          const profileData = await fetchProfile(currentSession.user.id);
          setProfile(profileData);
        }
      } catch (err) {
        console.error("[Auth] Init error:", err);
        setError("Error inicializando autenticación");
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // onAuthStateChange: ONLY update user/session state.
    // Profile fetch is handled by the separate useEffect below.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (event === "SIGNED_OUT" || !newSession) {
          setSession(null);
          setUser(null);
          setProfile(null);
          navigate("/login");
        } else if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && newSession) {
          setSession(newSession);
          setUser(newSession.user);
          // Profile is fetched by the separate useEffect that watches `user`
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

  // Separate useEffect: fetch profile when user changes.
  // This avoids making async PostgREST calls inside onAuthStateChange.
  // Also handles redirect after fresh login.
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);

      const isAuthPage = ["/login", "/register"].includes(window.location.pathname);
      if (isAuthPage && profileData) {
        navigate(profileData.role === "owner" ? "/owner" : "/app", { replace: true });
      }
    };

    loadProfile();
  }, [user?.id]);

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