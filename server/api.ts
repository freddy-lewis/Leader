import { randomUUID } from "node:crypto"

import { db, tx } from "./db.ts"

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// ---------- Events ----------

interface EventRow {
  id: string
  name: string
  date: string
  start_time: string
  end_time: string
  location: string
  capacity: number | null
  description: string
  created_at: string
}

const toEvent = (r: EventRow) => ({
  id: r.id,
  name: r.name,
  date: r.date,
  startTime: r.start_time,
  endTime: r.end_time,
  location: r.location,
  capacity: r.capacity,
  description: r.description,
  createdAt: r.created_at,
})

export function listEvents() {
  const rows = db.prepare("SELECT * FROM events ORDER BY date, start_time").all() as unknown as EventRow[]
  return rows.map(toEvent)
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "")

export function createEvent(body: Record<string, unknown>) {
  const name = str(body.name)
  const date = str(body.date)
  const startTime = str(body.startTime)
  const endTime = str(body.endTime)
  const capacity = body.capacity === null || body.capacity === undefined || body.capacity === "" ? null : Number(body.capacity)

  if (!name) throw new HttpError(400, "Name is required.")
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(400, "Date must be YYYY-MM-DD.")
  for (const t of [startTime, endTime]) {
    if (t && !/^\d{2}:\d{2}$/.test(t)) throw new HttpError(400, "Times must be HH:MM.")
  }
  if (startTime && endTime && endTime <= startTime) throw new HttpError(400, "End time must be after the start time.")
  if (capacity !== null && !(Number.isInteger(capacity) && capacity > 0)) {
    throw new HttpError(400, "Capacity must be a whole number above 0.")
  }

  const row: EventRow = {
    id: randomUUID(),
    name,
    date,
    start_time: startTime,
    end_time: endTime,
    location: str(body.location),
    capacity,
    description: str(body.description),
    created_at: new Date().toISOString(),
  }
  db.prepare(
    `INSERT INTO events (id, name, date, start_time, end_time, location, capacity, description, created_at)
     VALUES (:id, :name, :date, :start_time, :end_time, :location, :capacity, :description, :created_at)`,
  ).run({ ...row })
  return toEvent(row)
}

export function deleteEvent(id: string) {
  const { changes } = db.prepare("DELETE FROM events WHERE id = ?").run(id)
  if (!changes) throw new HttpError(404, "Event not found.")
}

// ---------- Guest lists ----------

interface GuestListRow {
  id: string
  file_name: string
  columns: string
  row_count: number
  created_at: string
}

const toSummary = (r: GuestListRow) => ({
  id: r.id,
  fileName: r.file_name,
  rowCount: r.row_count,
  createdAt: r.created_at,
})

export function listGuestLists() {
  const rows = db.prepare("SELECT * FROM guest_lists ORDER BY created_at DESC").all() as unknown as GuestListRow[]
  return rows.map(toSummary)
}

export function getGuestList(id: string) {
  const list = db.prepare("SELECT * FROM guest_lists WHERE id = ?").get(id) as GuestListRow | undefined
  if (!list) throw new HttpError(404, "Guest list not found.")
  const guests = db
    .prepare(`SELECT "values" FROM guests WHERE list_id = ? ORDER BY position`)
    .all(id) as { values: string }[]
  return {
    ...toSummary(list),
    header: JSON.parse(list.columns) as string[],
    rows: guests.map((g) => JSON.parse(g.values) as string[]),
  }
}

export function createGuestList(body: Record<string, unknown>) {
  const fileName = str(body.fileName) || "guests.csv"
  const { header, rows } = body
  const isStrings = (a: unknown): a is string[] => Array.isArray(a) && a.every((v) => typeof v === "string")
  if (!isStrings(header) || header.length === 0) throw new HttpError(400, "header must be a non-empty array of strings.")
  if (!Array.isArray(rows) || !rows.every(isStrings)) throw new HttpError(400, "rows must be an array of string arrays.")

  const id = randomUUID()
  const createdAt = new Date().toISOString()
  tx(() => {
    db.prepare(
      "INSERT INTO guest_lists (id, file_name, columns, row_count, created_at) VALUES (?, ?, ?, ?, ?)",
    ).run(id, fileName, JSON.stringify(header), rows.length, createdAt)
    const insert = db.prepare(`INSERT INTO guests (list_id, position, "values") VALUES (?, ?, ?)`)
    rows.forEach((r, i) => insert.run(id, i, JSON.stringify(r)))
  })
  return { id, fileName, rowCount: rows.length, createdAt }
}

export function deleteGuestList(id: string) {
  const { changes } = db.prepare("DELETE FROM guest_lists WHERE id = ?").run(id)
  if (!changes) throw new HttpError(404, "Guest list not found.")
}
