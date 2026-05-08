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
    try {
      console.log("[Auth] fetchProfile for:", userId);
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("[Auth] fetchProfile error:", profileError.message);
        setError("Error cargando perfil");
        return null;
      }

      console.log("[Auth] fetchProfile success:", data?.role, data?.full_name);
      return data;
    } catch (err) {
      console.error("[Auth] fetchProfile exception:", err);
      setError("Error cargando perfil");
      return null;
    }
  };

  useEffect(() => {
    // Subscribe to auth state changes FIRST, before any manual session setup.
    // This ensures we don't miss any events.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        try {
          console.log("[Auth] event:", event, "session:", !!newSession, "user:", newSession?.user?.id);

          if (event === "INITIAL_SESSION") {
            if (newSession) {
              setSession(newSession);
              setUser(newSession.user);
              const profileData = await fetchProfile(newSession.user.id);
              setProfile(profileData);
            }
            setIsLoading(false);
          } else if (event === "SIGNED_IN" && newSession) {
            setSession(newSession);
            setUser(newSession.user);
            setIsLoading(false);
            const profileData = await fetchProfile(newSession.user.id);
            setProfile(profileData);

            // Redirect based on role after fresh login
            const isAuthPage = ["/login", "/register"].includes(window.location.pathname);
            if (isAuthPage && profileData) {
              console.log("[Auth] redirecting to:", profileData.role === "owner" ? "/owner" : "/app");
              navigate(profileData.role === "owner" ? "/owner" : "/app", { replace: true });
            } else {
              console.log("[Auth] SIGNED_IN done — isAuthPage:", isAuthPage, "profile:", !!profileData);
            }
          } else if (event === "SIGNED_OUT" || !newSession) {
            console.log("[Auth] SIGNED_OUT");
            setSession(null);
            setUser(null);
            setProfile(null);
            setIsLoading(false);
            navigate("/login");
          } else if (event === "TOKEN_REFRESHED" && newSession) {
            setSession(newSession);
            setUser(newSession.user);
          }
        } catch (err) {
          console.error("[Auth] onAuthStateChange error:", err);
          setIsLoading(false);
        }
      }
    );

    // Handle OAuth callback AFTER subscribing.
    // With detectSessionInUrl:false, the hash won't be parsed automatically,
    // so we extract tokens and call setSession manually.
    const handleOAuthCallback = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        if (accessToken && refreshToken) {
          console.log("[Auth] OAuth callback — calling setSession");
          // Clean URL before setSession to avoid accidental re-processing
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
          try {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            console.log("[Auth] OAuth setSession done");
          } catch (err) {
            console.error("[Auth] OAuth setSession error:", err);
          }
        }
      }
    };

    handleOAuthCallback();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[Auth] signOut error:", err);
    }
    // State cleanup happens in onAuthStateChange SIGNED_OUT handler
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