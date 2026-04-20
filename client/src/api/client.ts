import { ApiErrorBody } from "../types/api";

const configuredBaseUrl = import.meta.env.VITE_API_URL;
const API_BASE_URL =
  configuredBaseUrl && configuredBaseUrl.trim().length > 0
    ? configuredBaseUrl.trim()
    : "/api";

function withBase(baseUrl: string, path: string): string {
  if (baseUrl.endsWith("/") && path.startsWith("/")) {
    return `${baseUrl.slice(0, -1)}${path}`;
  }
  if (!baseUrl.endsWith("/") && !path.startsWith("/")) {
    return `${baseUrl}/${path}`;
  }
  return `${baseUrl}${path}`;
}

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions extends RequestInit {
  token?: string;
}

function localFallbackBaseCandidates(): string[] {
  const currentOrigin = window.location.origin;
  const origin4100 = `${window.location.protocol}//${window.location.hostname}:4100`;
  const origin4000 = `${window.location.protocol}//${window.location.hostname}:4000`;
  return [
    `${currentOrigin}/api`,
    currentOrigin,
    `${origin4100}/api`,
    origin4100,
    `${origin4000}/api`,
    origin4000,
  ];
}

async function performFetch(url: string, init: RequestInit): Promise<Response | null> {
  try {
    return await fetch(url, init);
  } catch {
    return null;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  const requestHeaders = new Headers(headers ?? {});
  if (!requestHeaders.has("Content-Type") && rest.body) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const requestInit: RequestInit = {
    ...rest,
    headers: requestHeaders,
  };
  const candidateBases = Array.from(
    new Set([...(configuredBaseUrl ? [API_BASE_URL] : []), ...localFallbackBaseCandidates()]),
  );
  const attempts: string[] = [];

  let response: Response | null = null;
  for (const base of candidateBases) {
    const url = withBase(base, path);
    const next = await performFetch(url, requestInit);
    if (!next) {
      attempts.push(`${url} -> NETWORK_ERROR`);
      continue;
    }
    attempts.push(`${url} -> ${next.status}`);
    // Route mismatch fallback: continue probing on 404/405 endpoint mismatches.
    if (next.status === 404 || next.status === 405) {
      response = next;
      continue;
    }
    response = next;
    break;
  }

  if (!response) {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      `Unable to reach server. Please check backend is running. Tried: ${attempts.join(" | ")}`,
    );
  }

  if (!response.ok) {
    let payload: ApiErrorBody | null = null;
    let rawText = "";
    try {
      payload = (await response.json()) as ApiErrorBody;
    } catch {
      try {
        rawText = (await response.text()).trim();
      } catch {
        rawText = "";
      }
    }
    const fallbackMessage = `Request failed (${response.status}${
      response.statusText ? ` ${response.statusText}` : ""
    })`;
    const message =
      payload?.error.message && payload.error.message.trim().length > 0
        ? payload.error.message
        : rawText.length > 0
          ? rawText
          : fallbackMessage;
    const messageWithAttempts = `${message}. Tried: ${attempts.join(" | ")}`;

    throw new ApiError(
      response.status,
      payload?.error.code ?? "REQUEST_FAILED",
      messageWithAttempts,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
