import { useCallback, useEffect, useState } from "react"

import { api } from "@/lib/api"

export interface LeaderEvent {
  id: string
  name: string
  date: string // YYYY-MM-DD
  startTime: string // HH:MM, optional
  endTime: string // HH:MM, optional
  location: string
  capacity: number | null
  description: string
  createdAt: string // ISO
}

export type NewEvent = Omit<LeaderEvent, "id" | "createdAt">

/** Events stored in the SQLite database via the local API. */
export function useEvents() {
  const [events, setEvents] = useState<LeaderEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      setEvents(await api<LeaderEvent[]>("GET", "/events"))
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const addEvent = useCallback(async (input: NewEvent) => {
    const event = await api<LeaderEvent>("POST", "/events", input)
    setEvents((prev) => [...prev, event])
    return event
  }, [])

  const deleteEvent = useCallback(async (id: string) => {
    await api("DELETE", `/events/${id}`)
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }, [])

  return { events, loading, error, reload, addEvent, deleteEvent }
}

/** Local-date "today" as YYYY-MM-DD, for upcoming/past splits. */
export function todayISO() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function formatEventDate(e: Pick<LeaderEvent, "date" | "startTime" | "endTime">) {
  const [y, m, d] = e.date.split("-").map(Number)
  const day = new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
  const time = e.startTime ? (e.endTime ? `${e.startTime}–${e.endTime}` : e.startTime) : ""
  return time ? `${day} · ${time}` : day
}
