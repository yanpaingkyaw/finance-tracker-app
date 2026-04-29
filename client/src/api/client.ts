import { ApiErrorBody } from "../types/api";

const configuredBaseUrl =
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

const API_BASE_URL =
  configuredBaseUrl && configuredBaseUrl.trim().length > 0
    ? configuredBaseUrl.trim().replace(/\/$/, "")
    : "/api";

function withBase(baseUrl: string, path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
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

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { token, headers, ...rest } = options;

  const requestHeaders = new Headers(headers ?? {});

  if (!requestHeaders.has("Content-Type") && rest.body) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(withBase(API_BASE_URL, path), {
      ...rest,
      headers: requestHeaders,
    });
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      `Unable to reach server. Tried: ${withBase(API_BASE_URL, path)}`,
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
      payload?.error?.message && payload.error.message.trim().length > 0
        ? payload.error.message
        : rawText.length > 0
          ? rawText
          : fallbackMessage;

    throw new ApiError(
      response.status,
      payload?.error?.code ?? "REQUEST_FAILED",
      message,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}