import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Loader2 } from "lucide-react";

type AppRole = "super_admin" | "admin" | "hr_manager" | "hr_officer" | "tele_sales" | "accountant" | "support";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: AppRole[];
  requireAdmin?: boolean;
  requireHR?: boolean;
  requiredPermissions?: string[];
}

const ProtectedRoute = ({ 
  children, 
  requiredRoles, 
  requireAdmin = false,
  requireHR = false,
  requiredPermissions,
}: ProtectedRouteProps) => {
  const { user, loading, roles, isAdmin, isHR } = useAuth();
  const { hasAnyPermission, loading: permissionsLoading } = usePermissions();
  const location = useLocation();

  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Check for admin requirement
  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check for HR requirement
  if (requireHR && !isHR()) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check for specific role requirements
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some((role) => roles.includes(role));
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check for permission requirements (admins bypass this)
  if (requiredPermissions && requiredPermissions.length > 0 && !isAdmin()) {
    if (!hasAnyPermission(requiredPermissions)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
