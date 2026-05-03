import type { ApiResult, ApiRequestOptions } from "@/types";

export type { ApiResult, ApiRequestOptions };

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

async function parseResponse<T>(response: Response): Promise<ApiResult<T>> {
  let result: ApiResult<T>;

  try {
    result = await response.json();
  } catch {
    result = { ok: false, error: "The server returned an invalid response." };
  }

  if (!response.ok || !result.ok) {
    throw new Error(result.error || "The request could not be completed.");
  }

  return result;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResult<T>> {
  const { body, headers: optionHeaders, ...requestOptions } = options;
  const headers = new Headers(optionHeaders || {});

  const request: RequestInit = {
    ...requestOptions,
    headers,
    credentials: "include",
  };

  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    request.body = JSON.stringify(body);
  }

  const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
  const response = await fetch(url, request);
  return parseResponse<T>(response);
}

export async function apiGet<T = unknown>(path: string) {
  return apiRequest<T>(path);
}

export async function apiPost<T = unknown>(path: string, body?: unknown) {
  return apiRequest<T>(path, { method: "POST", body });
}

export async function apiPut<T = unknown>(path: string, body?: unknown) {
  return apiRequest<T>(path, { method: "PUT", body });
}

export async function apiDelete<T = unknown>(path: string) {
  return apiRequest<T>(path, { method: "DELETE" });
}
