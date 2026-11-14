/**
 * Small client-side helper for calling this app's JSON API routes.
 * Throws an Error carrying the server's message on non-2xx responses.
 */
export async function api<T = any>(
  url: string,
  init: Omit<RequestInit, "body"> & { json?: unknown; body?: BodyInit } = {}
): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(url, {
    ...rest,
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.error || "Request failed. Please try again.");
    (err as any).status = res.status;
    throw err;
  }
  return data as T;
}
