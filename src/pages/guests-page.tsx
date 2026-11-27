import { useCallback, useEffect, useState } from "react"
import { ArrowLeftIcon, FileSpreadsheetIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTable } from "@/components/data-table"
import { UploadZone } from "@/components/upload-zone"
import { api } from "@/lib/api"
import type { Dataset } from "@/lib/csv"
import { PageHeader } from "@/pages/events-page"

interface GuestListSummary {
  id: string
  fileName: string
  rowCount: number
  createdAt: string
}

type GuestList = GuestListSummary & Pick<Dataset, "header" | "rows">

export function GuestsPage({
  openId,
  onOpen,
}: {
  openId: string | null
  onOpen: (id: string | null) => void
}) {
  return openId ? (
    <OpenList id={openId} onClose={() => onOpen(null)} />
  ) : (
    <ListIndex onOpen={onOpen} />
  )
}

/** Saved guest lists plus an upload area to import a new one. */
function ListIndex({ onOpen }: { onOpen: (id: string) => void }) {
  const [lists, setLists] = useState<GuestListSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      setLists(await api<GuestListSummary[]>("GET", "/guest-lists"))
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function importFile(data: Dataset) {
    setSaving(true)
    setError(null)
    try {
      const saved = await api<GuestListSummary>("POST", "/guest-lists", data)
      onOpen(saved.id)
    } catch (e) {
      setError(`Couldn’t save the guest list: ${(e as Error).message}`)
      setSaving(false)
    }
  }

  async function remove(list: GuestListSummary) {
    if (!confirm(`Delete “${list.fileName}” and its ${list.rowCount.toLocaleString()} guests? This can’t be undone.`)) return
    try {
      await api("DELETE", `/guest-lists/${list.id}`)
      setLists((prev) => prev?.filter((l) => l.id !== list.id) ?? null)
    } catch (e) {
      setError(`Couldn’t delete: ${(e as Error).message}`)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Guest list" description="Import a guest export (CSV). It’s saved to the local database." />

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {lists && lists.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved guest lists</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>File</TableHead>
                  <TableHead className="text-right">Guests</TableHead>
                  <TableHead>Imported</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lists.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => onOpen(l.id)}
                        className="flex cursor-pointer items-center gap-2 text-left font-medium hover:underline"
                      >
                        <FileSpreadsheetIcon className="size-4 shrink-0 text-muted-foreground" />
                        {l.fileName}
                      </button>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{l.rowCount.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(l.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => onOpen(l.id)}>
                          Open
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${l.fileName}`}
                          onClick={() => remove(l)}
                        >
                          <Trash2Icon />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {saving ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Saving guest list…</p>
      ) : (
        <div className={lists && lists.length > 0 ? "[&>div]:mt-0" : undefined}>
          <UploadZone onLoad={importFile} />
        </div>
      )}
    </div>
  )
}

/** One saved guest list, loaded from the database into the table view. */
function OpenList({ id, onClose }: { id: string; onClose: () => void }) {
  const [list, setList] = useState<GuestList | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api<GuestList>("GET", `/guest-lists/${id}`)
      .then((l) => !cancelled && setList(l))
      .catch((e: Error) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Guest list"
        action={
          <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            {list && (
              <>
                <FileSpreadsheetIcon className="size-4 shrink-0" />
                <span className="truncate">
                  {list.fileName} · {list.rowCount.toLocaleString()} rows
                </span>
              </>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              <ArrowLeftIcon />
              All guest lists
            </Button>
          </div>
        }
      />
      {error ? (
        <p role="alert" className="text-sm text-destructive">{error}</p>
      ) : list ? (
        <DataTable key={list.id} data={list} />
      ) : (
        <p className="py-16 text-center text-sm text-muted-foreground">Loading guests…</p>
      )}
    </div>
  )
}
