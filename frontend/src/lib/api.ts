const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Tokens {
  access_token: string;
  refresh_token: string;
}

let tokenStore: Tokens | null = null;
let isRefreshing = false;

export function getRefreshToken(): string | null {
  if (tokenStore) return tokenStore.refresh_token;
  if (typeof window !== "undefined") {
    return localStorage.getItem("refresh_token");
  }
  return null;
}

export function setTokens(tokens: Tokens) {
  tokenStore = tokens;
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
  }
}

export function getAccessToken(): string | null {
  if (tokenStore) return tokenStore.access_token;
  if (typeof window !== "undefined") {
    return localStorage.getItem("access_token");
  }
  return null;
}

export function clearTokens() {
  tokenStore = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }
}

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res = await fetch(`${API_URL}/api${path}`, { ...options, headers });
  if (res.status === 401 && token) {
    const refreshToken = getRefreshToken();
    if (refreshToken && !isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshRes.ok) {
          const newTokens: Tokens = await refreshRes.json();
          setTokens(newTokens);
          isRefreshing = false;

          // Retry original request with new token
          headers["Authorization"] = `Bearer ${newTokens.access_token}`;
          res = await fetch(`${API_URL}/api${path}`, { ...options, headers });
          return res;
        }
      } catch (err) {
        console.error("Token refresh failed:", err);
      }
      isRefreshing = false;
    }

    clearTokens();
    if (typeof window !== "undefined") window.location.href = "/login";
  }
  return res;
}

export async function login(username: string, password: string) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.detail || "Login failed");
  }
  const data = await res.json();
  setTokens({ access_token: data.access_token, refresh_token: data.refresh_token });
  return data.user;
}

export async function fetchMe() {
  const res = await authFetch("/auth/me");
  if (!res.ok) return null;
  return res.json();
}

export async function fetchRanking(tahun: number, bulan: number) {
  const res = await authFetch(`/analytics/opd-ranking?tahun=${tahun}&bulan=${bulan}`);
  return res.json();
}

export async function fetchOpdDetail(opdId: number, tahun: number, bulan: number) {
  const res = await authFetch(`/analytics/opd/${opdId}?tahun=${tahun}&bulan=${bulan}`);
  return res.json();
}

export async function uploadExcel(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await authFetch("/presensi/upload", {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.errors?.[0]?.reason || `Upload gagal (HTTP ${res.status})`);
  }
  return data;
}

export function getPdfUrl(tahun: number, bulan: number): string {
  const token = getAccessToken();
  return `${API_URL}/api/reports/pdf?tahun=${tahun}&bulan=${bulan}&token=${token}`;
}

export async function runAnalytics(tahun: number, bulan: number) {
  const res = await authFetch(`/analytics/run?tahun=${tahun}&bulan=${bulan}`, {
    method: "POST",
  });
  return res.json();
}

export async function fetchOpdUploadStatus(tahun: number, bulan: number) {
  const res = await authFetch(`/presensi/status-opd?tahun=${tahun}&bulan=${bulan}`);
  return res.json();
}

export async function fetchPeriods() {
  const res = await authFetch("/presensi/periods");
  return res.json();
}
