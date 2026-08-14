import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
import { Quadra, User } from "../types";

interface AuthContextValue {
  user: User | null;
  quadra: Quadra | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [quadra, setQuadra] = useState<Quadra | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("arena180:token");
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/auth/me")
      .then((res) => {
        setUser({ id: res.data.id, name: res.data.name, email: res.data.email, role: res.data.role });
        setQuadra(res.data.quadra);
      })
      .catch(() => {
        localStorage.removeItem("arena180:token");
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("arena180:token", res.data.token);
    setUser(res.data.user);
    setQuadra(res.data.quadra);
  }

  function logout() {
    localStorage.removeItem("arena180:token");
    setUser(null);
    setQuadra(null);
  }

  return (
    <AuthContext.Provider value={{ user, quadra, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return ctx;
}
