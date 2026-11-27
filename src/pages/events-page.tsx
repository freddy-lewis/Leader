import { useState } from "react"
import { CalendarPlusIcon, MapPinIcon, MoreHorizontalIcon, Trash2Icon, UsersIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatEventDate, todayISO, type LeaderEvent } from "@/lib/events"
import { href } from "@/lib/router"

type Filter = "upcoming" | "past" | "all"

export function EventsPage({
  events,
  loading,
  error,
  onRetry,
  onDelete,
}: {
  events: LeaderEvent[]
  loading: boolean
  error: string | null
  onRetry: () => void
  onDelete: (id: string) => Promise<void>
}) {
  const [filter, setFilter] = useState<Filter>("upcoming")
  const today = todayISO()

  const byDate = (a: LeaderEvent, b: LeaderEvent) =>
    (a.date + a.startTime).localeCompare(b.date + b.startTime)
  const upcoming = events.filter((e) => e.date >= today).sort(byDate)
  const past = events.filter((e) => e.date < today).sort((a, b) => byDate(b, a))
  const shown = filter === "upcoming" ? upcoming : filter === "past" ? past : [...upcoming, ...past]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="All events"
        description="Everything you’re hosting, upcoming first."
        action={
          <Button asChild>
            <a href={href("/events/new")}>
              <CalendarPlusIcon />
              Create event
            </a>
          </Button>
        }
      />

      {error ? (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading events…</p>
      ) : events.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={filter}
            onValueChange={(v) => v && setFilter(v as Filter)}
            className="self-start"
          >
            <ToggleGroupItem value="upcoming">Upcoming · {upcoming.length}</ToggleGroupItem>
            <ToggleGroupItem value="past">Past · {past.length}</ToggleGroupItem>
            <ToggleGroupItem value="all">All · {events.length}</ToggleGroupItem>
          </ToggleGroup>

          {shown.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No {filter} events.
            </p>
          ) : (
            <div className="grid gap-3">
              {shown.map((e) => (
                <EventRow key={e.id} event={e} isPast={e.date < today} onDelete={onDelete} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function EventRow({
  event,
  isPast,
  onDelete,
}: {
  event: LeaderEvent
  isPast: boolean
  onDelete: (id: string) => Promise<void>
}) {
  const [y, m, d] = event.date.split("-").map(Number)
  const date = new Date(y, m - 1, d)

  return (
    <Card size="sm" className={isPast ? "opacity-70" : undefined}>
      <CardContent className="flex items-start gap-4">
        <div className="flex w-14 shrink-0 flex-col items-center rounded-lg border bg-muted/50 py-1.5">
          <span className="text-[11px] font-medium text-muted-foreground uppercase">
            {date.toLocaleDateString(undefined, { month: "short" })}
          </span>
          <span className="text-xl leading-tight font-semibold tabular-nums">{date.getDate()}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-medium">{event.name}</h3>
            {isPast && <Badge variant="secondary">Past</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{formatEventDate(event)}</p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPinIcon className="size-3.5" />
                {event.location}
              </span>
            )}
            {event.capacity !== null && (
              <span className="flex items-center gap-1">
                <UsersIcon className="size-3.5" />
                {event.capacity.toLocaleString()} capacity
              </span>
            )}
          </div>
          {event.description && (
            <p className="mt-2 line-clamp-2 text-sm">{event.description}</p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${event.name}`}>
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => {
                if (!confirm(`Delete “${event.name}”? This can’t be undone.`)) return
                onDelete(event.id).catch((err: Error) => alert(`Couldn’t delete the event: ${err.message}`))
              }}
            >
              <Trash2Icon />
              Delete event
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <CalendarPlusIcon className="size-5" />
      </div>
      <div>
        <p className="font-medium">No events yet</p>
        <p className="text-sm text-muted-foreground">Create your first event to get started.</p>
      </div>
      <Button asChild>
        <a href={href("/events/new")}>Create event</a>
      </Button>
    </div>
  )
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}
