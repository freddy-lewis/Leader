/** Thin JSON client for the local Leader API (proxied to the SQLite server by Vite). */
export async function api<T>(method: "GET" | "POST" | "DELETE", path: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new Error("Can’t reach the Leader server. Is it running (npm run dev)?")
  }
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const fallback = res.status >= 500 ? "Can’t reach the Leader server. Is it running (npm run dev)?" : `Request failed (${res.status}).`
    throw new Error(data?.error ?? fallback)
  }
  return data as T
}
