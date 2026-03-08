import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const checkAuth = async (session: any) => {
      if (!session) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }
      setAuthenticated(true);
      // Check if user is blocked
      const { data } = await supabase
        .from("profiles")
        .select("is_blocked")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (data?.is_blocked) {
        setBlocked(true);
        await supabase.auth.signOut();
      }
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      checkAuth(session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAuth(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;
  if (blocked) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "DM Sans, sans-serif", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Account Blocked</h2>
        <p style={{ color: "#64748B", marginBottom: 24 }}>Your account has been suspended. Please contact support for assistance.</p>
        <a href="/auth" style={{ color: "#4B7BF5", fontWeight: 600, textDecoration: "none" }}>Back to Login</a>
      </div>
    </div>
  );
  if (!authenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
