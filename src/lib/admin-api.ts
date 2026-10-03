/**
 * The admin panel's one way of calling its own API from the browser: sends JSON,
 * never throws, and turns any failure into a message the page can show.
 */
export type ApiResult<T> = { ok: true; data: T; error?: undefined } | { ok: false; data?: undefined; error: string };

export async function apiSend<T = Record<string, unknown>>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
  fallbackError = "Something went wrong. Please try again."
): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: "Could not reach the server. Check your connection and try again." };
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: (data as { error?: string }).error || fallbackError };
  return { ok: true, data: data as T };
}
