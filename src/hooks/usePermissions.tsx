import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PermissionCategory, PAGE_PERMISSIONS } from "@/types/permissions";
import { logger } from "@/lib/logger";

interface PermissionsContextType {
  permissions: string[];
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasCategoryAccess: (category: PermissionCategory) => boolean;
  canAccessPage: (path: string) => boolean;
  refetchPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  const fetchPermissions = async () => {
    if (!user) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_permissions")
        .select("permission")
        .eq("user_id", user.id);

      if (error) {
        logger.error("Error fetching permissions", { error, userId: user.id });
        setPermissions([]);
      } else {
        setPermissions(data?.map((p) => p.permission) || []);
      }
    } catch (error) {
      logger.error("Error fetching permissions", { error, userId: user.id });
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [user]);

  const hasPermission = (permission: string): boolean => {
    // Admins have all permissions
    if (isAdmin()) return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (perms: string[]): boolean => {
    if (isAdmin()) return true;
    return perms.some((p) => permissions.includes(p));
  };

  const hasAllPermissions = (perms: string[]): boolean => {
    if (isAdmin()) return true;
    return perms.every((p) => permissions.includes(p));
  };

  const hasCategoryAccess = (category: PermissionCategory): boolean => {
    if (isAdmin()) return true;
    return permissions.some((p) => {
      // Simple check - permission name contains category
      return p.includes(category);
    });
  };

  const canAccessPage = (path: string): boolean => {
    if (isAdmin()) return true;
    
    const requiredPermissions = PAGE_PERMISSIONS[path];
    if (!requiredPermissions) return true; // No restrictions
    
    return hasAnyPermission(requiredPermissions);
  };

  const refetchPermissions = async () => {
    setLoading(true);
    await fetchPermissions();
  };

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        loading,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasCategoryAccess,
        canAccessPage,
        refetchPermissions,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
};
