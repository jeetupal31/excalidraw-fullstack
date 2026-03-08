const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
// Ensure No Trailing Slash
const API_BASE_URL = VITE_API_BASE_URL.endsWith("/")
  ? VITE_API_BASE_URL.slice(0, -1)
  : VITE_API_BASE_URL;

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

  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${normalizedPath}`;

  try {
    const response = await fetch(url, {
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
  } catch (err) {
    console.error("API Request Error:", err);
    if (url.includes("localhost") && window.location.protocol === "https:") {
      return {
        error: "Security Block: HTTPS sites cannot connect to http://localhost. See deployment_guide.md for help.",
        status: 0,
      };
    }
    return { error: "Network error. Is the server running?", status: 0 };
  }
}
