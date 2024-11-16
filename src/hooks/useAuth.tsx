import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Agent, Customer } from "@/types/database";

type UserDetails = (Agent | Customer) & { role: "agent" | "customer" };

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userDetails: UserDetails | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserDetails(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserDetails(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserDetails = async (userId: string) => {
    const role = (await supabase.auth.getUser()).data.user?.user_metadata?.role || "customer";
    
    const { data } = await supabase
      .from(role === "agent" ? "agents" : "customers")
      .select("*")
      .eq("id", userId)
      .single();

    setUserDetails(data ? { ...data, role } : null);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserDetails(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, userDetails, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};