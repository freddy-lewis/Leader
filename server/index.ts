import { createServer, type IncomingMessage, type ServerResponse } from "node:http"

import {
  HttpError,
  createEvent,
  createGuestList,
  deleteEvent,
  deleteGuestList,
  getGuestList,
  listEvents,
  listGuestLists,
} from "./api.ts"
import { dbPath } from "./db.ts"

const PORT = Number(process.env.PORT ?? 3001)
const HOST = "127.0.0.1" // local only: the database holds guests' personal details
const MAX_BODY = 25 * 1024 * 1024

type Handler = (params: string[], body: Record<string, unknown>) => unknown

const routes: [method: string, pattern: RegExp, handler: Handler][] = [
  ["GET", /^\/api\/events$/, () => listEvents()],
  ["POST", /^\/api\/events$/, (_, body) => createEvent(body)],
  ["DELETE", /^\/api\/events\/([\w-]+)$/, ([id]) => deleteEvent(id)],
  ["GET", /^\/api\/guest-lists$/, () => listGuestLists()],
  ["POST", /^\/api\/guest-lists$/, (_, body) => createGuestList(body)],
  ["GET", /^\/api\/guest-lists\/([\w-]+)$/, ([id]) => getGuestList(id)],
  ["DELETE", /^\/api\/guest-lists\/([\w-]+)$/, ([id]) => deleteGuestList(id)],
]

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY) throw new HttpError(413, "Request body is too large.")
    chunks.push(chunk)
  }
  if (!size) return {}
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"))
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed
  } catch {
    // fall through
  }
  throw new HttpError(400, "Body must be a JSON object.")
}

function send(res: ServerResponse, status: number, data?: unknown) {
  if (data === undefined) {
    res.writeHead(status).end()
    return
  }
  res.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify(data))
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost")
  const method = req.method ?? "GET"
  try {
    const matches = routes.filter(([, pattern]) => pattern.test(url.pathname))
    if (!matches.length) throw new HttpError(404, "Not found.")
    const route = matches.find(([m]) => m === method)
    if (!route) throw new HttpError(405, "Method not allowed.")

    const params = route[1].exec(url.pathname)!.slice(1)
    const body = method === "POST" ? await readJson(req) : {}
    const result = route[2](params, body)
    send(res, result === undefined ? 204 : method === "POST" ? 201 : 200, result)
  } catch (err) {
    if (err instanceof HttpError) return send(res, err.status, { error: err.message })
    console.error(err)
    send(res, 500, { error: "Something went wrong." })
  }
})

server.listen(PORT, HOST, () => {
  console.log(`Leader API on http://${HOST}:${PORT} (database: ${dbPath})`)
})
