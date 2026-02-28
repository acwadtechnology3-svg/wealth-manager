import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/types/database";
import { logger } from "@/lib/logger";

// Profile interface with optional fields for flexibility
interface Profile {
  id?: string;
  user_id?: string;
  email: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  department?: string | null;
  employee_code?: string | null;
  active_status?: boolean;
  is_active?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  isHR: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer fetching to avoid blocking the auth state change
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile with fallback (support both user_id and id schemas)
      let profileData: Profile | null = null;

      const { data: primaryProfile, error: primaryError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (primaryError) {
        const isMissingColumn = primaryError.message?.includes("user_id");
        if (!isMissingColumn && primaryError.code !== "PGRST116") {
          logger.error("Error fetching profile", { error: primaryError, userId });
        }
      } else if (primaryProfile) {
        profileData = primaryProfile as Profile;
      }

      // Fallback: try fetching by id if user_id didn't work
      if (!profileData) {
        const { data: fallbackProfile, error: fallbackError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (fallbackError && fallbackError.code !== "PGRST116") {
          logger.error("Error fetching profile (fallback)", { error: fallbackError, userId });
        }

        if (fallbackProfile) {
          profileData = fallbackProfile as Profile;
        }
      }

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (rolesError) {
        logger.error("Error fetching roles", { error: rolesError, userId });
      }

      if (rolesData) {
        setRoles(rolesData.map((r) => r.role as AppRole));
      }
    } catch (error) {
      logger.error("Error fetching user data", { error, userId });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  const hasRole = (role: AppRole) => roles.includes(role);

  // Admin includes super_admin and admin
  const isAdmin = () => hasRole("super_admin") || hasRole("admin");

  // Super admin includes super_admin
  const isSuperAdmin = () => hasRole("super_admin");

  // HR access includes super_admin, admin, hr_manager, and hr_officer
  const isHR = () =>
    hasRole("super_admin") ||
    hasRole("admin") ||
    hasRole("hr_manager") ||
    hasRole("hr_officer");

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        loading,
        signOut,
        hasRole,
        isAdmin,
        isSuperAdmin,
        isHR,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
