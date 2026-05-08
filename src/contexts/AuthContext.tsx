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
    // Handle OAuth callback manually since detectSessionInUrl is false.
    // Google redirects back with tokens in the URL hash; we extract them
    // and inject into the supabase client via setSession().
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      console.log("[Auth] OAuth callback detected, tokens found:", !!accessToken, !!refreshToken);
      if (accessToken && refreshToken) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }
    }

    // onAuthStateChange is the SINGLE source of truth for auth state.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("[Auth] onAuthStateChange:", event, "session:", !!newSession, "user:", newSession?.user?.id);

        if (event === "INITIAL_SESSION") {
          if (newSession) {
            setSession(newSession);
            setUser(newSession.user);
            const profileData = await fetchProfile(newSession.user.id);
            console.log("[Auth] INITIAL_SESSION profile:", profileData?.role, profileData?.full_name);
            setProfile(profileData);
          } else {
            console.log("[Auth] INITIAL_SESSION: no session (not logged in)");
          }
          setIsLoading(false);
        } else if (event === "SIGNED_IN" && newSession) {
          setSession(newSession);
          setUser(newSession.user);
          const profileData = await fetchProfile(newSession.user.id);
          console.log("[Auth] SIGNED_IN profile:", profileData?.role, profileData?.full_name);
          setProfile(profileData);

          const isAuthPage = ["/login", "/register"].includes(window.location.pathname);
          if (isAuthPage && profileData) {
            console.log("[Auth] Redirecting to:", profileData.role === "owner" ? "/owner" : "/app");
            navigate(profileData.role === "owner" ? "/owner" : "/app", { replace: true });
          }
        } else if (event === "SIGNED_OUT" || !newSession) {
          console.log("[Auth] SIGNED_OUT or null session");
          setSession(null);
          setUser(null);
          setProfile(null);
          navigate("/login");
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