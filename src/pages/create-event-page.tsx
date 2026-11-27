import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { todayISO, type NewEvent } from "@/lib/events"
import { href } from "@/lib/router"
import { PageHeader } from "@/pages/events-page"

type Errors = Partial<Record<"name" | "date" | "endTime" | "capacity", string>>

export function CreateEventPage({ onCreate }: { onCreate: (e: NewEvent) => Promise<void> }) {
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    date: todayISO(),
    startTime: "",
    endTime: "",
    location: "",
    capacity: "",
    description: "",
  })
  const [errors, setErrors] = useState<Errors>({})

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }))

  function validate(): Errors {
    const errs: Errors = {}
    if (!form.name.trim()) errs.name = "Give your event a name."
    if (!form.date) errs.date = "Pick a date."
    if (form.startTime && form.endTime && form.endTime <= form.startTime)
      errs.endTime = "End time must be after the start time."
    if (form.capacity && !(Number.isInteger(Number(form.capacity)) && Number(form.capacity) > 0))
      errs.capacity = "Capacity must be a whole number above 0."
    return errs
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length || saving) return
    setSaving(true)
    setSaveError(null)
    try {
      await onCreate({
      name: form.name.trim(),
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      location: form.location.trim(),
      capacity: form.capacity ? Number(form.capacity) : null,
      description: form.description.trim(),
      })
    } catch (err) {
      setSaveError((err as Error).message)
      setSaving(false)
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title="Create event" description="Set the basics. You can import guests afterwards." />

      <Card>
        <form onSubmit={submit} noValidate>
          <CardContent className="grid gap-5">
            <Field id="name" label="Event name" error={errors.name}>
              <Input id="name" value={form.name} onChange={set("name")} placeholder="e.g. Future of Data – Bangalore" autoFocus aria-invalid={!!errors.name} />
            </Field>

            <div className="grid gap-5 sm:grid-cols-3">
              <Field id="date" label="Date" error={errors.date}>
                <Input id="date" type="date" value={form.date} onChange={set("date")} aria-invalid={!!errors.date} />
              </Field>
              <Field id="startTime" label="Start time" hint="Optional">
                <Input id="startTime" type="time" value={form.startTime} onChange={set("startTime")} />
              </Field>
              <Field id="endTime" label="End time" hint="Optional" error={errors.endTime}>
                <Input id="endTime" type="time" value={form.endTime} onChange={set("endTime")} aria-invalid={!!errors.endTime} />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Field id="location" label="Location" hint="Optional">
                  <Input id="location" value={form.location} onChange={set("location")} placeholder="Venue, address or online link" />
                </Field>
              </div>
              <Field id="capacity" label="Capacity" hint="Optional" error={errors.capacity}>
                <Input id="capacity" type="number" min={1} inputMode="numeric" value={form.capacity} onChange={set("capacity")} aria-invalid={!!errors.capacity} />
              </Field>
            </div>

            <Field id="description" label="Description" hint="Optional">
              <Textarea id="description" rows={4} value={form.description} onChange={set("description")} placeholder="What’s the event about?" />
            </Field>
          </CardContent>

          <CardFooter className="mt-6 flex-wrap justify-end gap-2 border-t pt-4">
            {saveError && (
              <p role="alert" className="mr-auto text-sm text-destructive">
                {saveError}
              </p>
            )}
            <Button variant="outline" asChild>
              <a href={href("/events")}>Cancel</a>
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Create event"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>
        {label}
        {hint && <span className="font-normal text-muted-foreground">{hint}</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
