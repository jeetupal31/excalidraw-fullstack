import { createContext, useContext, useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  apiRequest,
  setStoredToken,
  clearStoredToken,
  getStoredToken,
} from "../services/apiClient";

interface AuthUser {
  id: string;
  email: string;
  username: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  signup: (email: string, username: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState(true);

  // Load user from stored token on mount
  useEffect(() => {
    const loadUser = async () => {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      const result = await apiRequest<{ user: AuthUser }>("/api/auth/me");
      if (result.data) {
        setUser(result.data.user);
        setToken(storedToken);
      } else {
        clearStoredToken();
        setToken(null);
      }

      setIsLoading(false);
    };

    void loadUser();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const result = await apiRequest<{ user: AuthUser; token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (result.error) {
      return result.error;
    }

    if (result.data) {
      setUser(result.data.user);
      setToken(result.data.token);
      setStoredToken(result.data.token);
    }

    return null;
  }, []);

  const signup = useCallback(
    async (email: string, username: string, password: string): Promise<string | null> => {
      const result = await apiRequest<{ user: AuthUser; token: string }>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, username, password }),
      });

      if (result.error) {
        return result.error;
      }

      if (result.data) {
        setUser(result.data.user);
        setToken(result.data.token);
        setStoredToken(result.data.token);
      }

      return null;
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    clearStoredToken();
  }, []);

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
