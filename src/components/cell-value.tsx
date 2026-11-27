import { Badge } from "@/components/ui/badge"
import { capitalize, cn } from "@/lib/utils"

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  accepted: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  confirmed: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  invited: "bg-sky-500/12 text-sky-700 dark:text-sky-400",
  pending: "bg-sky-500/12 text-sky-700 dark:text-sky-400",
  waitlist: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  waitlisted: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  declined: "bg-red-500/12 text-red-700 dark:text-red-400",
  rejected: "bg-red-500/12 text-red-700 dark:text-red-400",
  cancelled: "bg-red-500/12 text-red-700 dark:text-red-400",
}


export function StatusBadge({ value }: { value: string }) {
  return (
    <Badge variant="secondary" className={cn(STATUS_STYLES[value.toLowerCase()])}>
      {capitalize(value)}
    </Badge>
  )
}

export function CellValue({
  header,
  value,
  isStatus,
}: {
  header: string
  value: string
  isStatus: boolean
}) {
  if (value === "") return <span className="text-muted-foreground/50">—</span>
  if (isStatus) return <StatusBadge value={value} />

  if (/^https?:\/\//i.test(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        title={value}
        className="text-primary underline-offset-4 hover:underline"
      >
        Open link
      </a>
    )
  }

  if (/(_at|date)$/i.test(header) && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) {
      return (
        <span title={value} className="tabular-nums">
          {d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
        </span>
      )
    }
  }

  if (/email/i.test(header)) {
    return (
      <a href={`mailto:${value}`} className="text-primary underline-offset-4 hover:underline">
        {value}
      </a>
    )
  }

  return (
    <span title={value} className="inline-block max-w-80 truncate align-bottom">
      {value}
    </span>
  )
}
