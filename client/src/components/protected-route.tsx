import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated()) {
        setLocation("/login");
      } else if (requireAdmin && !isAdmin()) {
        setLocation("/");
      }
    }
  }, [isAuthenticated, isAdmin, requireAdmin, isLoading, setLocation]);

  // Show loading or nothing while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated or not admin (when required)
  if (!isAuthenticated() || (requireAdmin && !isAdmin())) {
    return null;
  }

  return <>{children}</>;
}

