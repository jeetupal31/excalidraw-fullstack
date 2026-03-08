const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

function getStoredToken(): string | null {
  return localStorage.getItem("auth_token");
}

export function setStoredToken(token: string): void {
  localStorage.setItem("auth_token", token);
}

export function clearStoredToken(): void {
  localStorage.removeItem("auth_token");
}

export { getStoredToken };

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getStoredToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    const body = await response.json();

    if (!response.ok) {
      return {
        error: body.error ?? "Request failed.",
        status: response.status,
      };
    }

    return { data: body as T, status: response.status };
  } catch {
    return { error: "Network error. Is the server running?", status: 0 };
  }
}
