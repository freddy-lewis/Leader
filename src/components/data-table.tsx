import { useMemo, useRef, useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type SortingFn,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Columns3Icon,
  DownloadIcon,
  SearchIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { CellValue } from "@/components/cell-value"
import { capitalize } from "@/lib/utils"
import { toCSV, type Dataset } from "@/lib/csv"

type Row = string[]

const colId = (i: number) => `c${i}`
const colIndex = (id: string) => Number(id.slice(1))

/** Numbers (incl. currency like "$0.00") and ISO dates sort by value; everything else naturally. */
function toSortable(v: string): number | null {
  const s = v.replace(/[$€£₹,\s]/g, "")
  if (/^-?\d+(\.\d+)?$/.test(s)) return parseFloat(s)
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
    const t = Date.parse(v)
    return Number.isNaN(t) ? null : t
  }
  return null
}

const smartSort: SortingFn<Row> = (a, b, id) => {
  const x = a.getValue<string>(id)
  const y = b.getValue<string>(id)
  if (x === y) return 0
  if (x === "") return 1
  if (y === "") return -1
  const nx = toSortable(x)
  const ny = toSortable(y)
  if (nx !== null && ny !== null) return nx - ny
  return x.localeCompare(y, undefined, { numeric: true, sensitivity: "base" })
}

const equalsFilter: FilterFn<Row> = (row, id, value) => row.getValue<string>(id) === value

/** A status-like column (name contains "status", ≤10 distinct values) drives the filter chips. */
function findStatusColumn({ header, rows }: Dataset): number {
  const idx = header.findIndex((h) => /status/i.test(h))
  if (idx === -1) return -1
  const distinct = new Set(rows.map((r) => r[idx]).filter(Boolean))
  return distinct.size > 0 && distinct.size <= 10 ? idx : -1
}

function emptyColumnsHidden({ header, rows }: Dataset): VisibilityState {
  return Object.fromEntries(header.map((_, i) => [colId(i), rows.some((r) => r[i] !== "")]))
}

export function DataTable({ data }: { data: Dataset }) {
  const statusCol = useMemo(() => findStatusColumn(data), [data])
  const statusCounts = useMemo(() => {
    if (statusCol < 0) return []
    const m = new Map<string, number>()
    for (const r of data.rows) if (r[statusCol]) m.set(r[statusCol], (m.get(r[statusCol]) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [data, statusCol])

  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() =>
    emptyColumnsHidden(data),
  )

  // Search only the columns that are currently shown.
  const visibilityRef = useRef(columnVisibility)
  visibilityRef.current = columnVisibility
  const searchFilter: FilterFn<Row> = (row, id, value: string) =>
    visibilityRef.current[id] !== false &&
    row.getValue<string>(id).toLowerCase().includes(value.trim().toLowerCase())

  const columns = useMemo<ColumnDef<Row>[]>(
    () =>
      data.header.map((h, i) => ({
        id: colId(i),
        header: h,
        accessorFn: (r) => r[i],
        sortingFn: smartSort,
        filterFn: equalsFilter,
        cell: (ctx) => (
          <CellValue header={h} value={ctx.getValue<string>()} isStatus={i === statusCol} />
        ),
      })),
    [data, statusCol],
  )

  const table = useReactTable({
    data: data.rows,
    columns,
    state: { sorting, globalFilter, columnFilters, columnVisibility },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: searchFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 50 } },
  })

  const statusFilter =
    (columnFilters.find((f) => f.id === colId(statusCol))?.value as string | undefined) ?? "__all"

  const total = data.rows.length
  const filtered = table.getPrePaginationRowModel().rows.length
  const { pageIndex, pageSize } = table.getState().pagination
  const from = filtered ? pageIndex * pageSize + 1 : 0
  const to = Math.min((pageIndex + 1) * pageSize, filtered)

  function exportView() {
    const cols = table.getVisibleLeafColumns()
    const rows = table
      .getPrePaginationRowModel()
      .rows.map((r) => cols.map((c) => r.original[colIndex(c.id)]))
    const csv = toCSV(
      cols.map((c) => data.header[colIndex(c.id)]),
      rows,
    )
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `${data.fileName.replace(/\.csv$/i, "")} (filtered).csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Total rows" value={total} />
        {statusCounts.map(([status, n]) => (
          <Stat key={status} label={capitalize(status)} value={n} />
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-80">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search visible columns…"
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value)
              table.setPageIndex(0)
            }}
            className="pl-8"
          />
        </div>

        {statusCol >= 0 && (
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={statusFilter}
            onValueChange={(v) => {
              if (!v) return // keep one option selected
              table.getColumn(colId(statusCol))?.setFilterValue(v === "__all" ? undefined : v)
              table.setPageIndex(0)
            }}
          >
            <ToggleGroupItem value="__all">All</ToggleGroupItem>
            {statusCounts.map(([status]) => (
              <ToggleGroupItem key={status} value={status}>
                {capitalize(status)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}

        <div className="flex gap-2 sm:ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3Icon />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-96 w-72 overflow-y-auto">
              <DropdownMenuLabel>Show columns</DropdownMenuLabel>
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); table.toggleAllColumnsVisible(true) }}>
                Show all
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setColumnVisibility(emptyColumnsHidden(data)) }}>
                Hide empty columns
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {table.getAllLeafColumns().map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onCheckedChange={(v) => col.toggleVisibility(!!v)}
                  onSelect={(e) => e.preventDefault()}
                >
                  <span className="truncate">{data.header[colIndex(col.id)]}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={exportView}>
            <DownloadIcon />
            Export view
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="max-h-[calc(100vh-22rem)] min-h-64 overflow-auto rounded-xl border bg-card">
        <Table className="w-max min-w-full">
          <TableHeader className="sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_var(--border)]">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                <TableHead className="w-12 text-right text-muted-foreground">#</TableHead>
                {hg.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  return (
                    <TableHead
                      key={header.id}
                      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"}
                      className="px-1"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-0.5 font-medium text-muted-foreground data-[sorted=true]:text-foreground"
                        data-sorted={!!sorted}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sorted === "asc" ? (
                          <ArrowUpIcon />
                        ) : sorted === "desc" ? (
                          <ArrowDownIcon />
                        ) : (
                          <ChevronsUpDownIcon className="opacity-40" />
                        )}
                      </Button>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, n) => (
                <TableRow key={row.id}>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {from + n}
                  </TableCell>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={table.getVisibleLeafColumns().length + 1}
                  className="h-32 text-center text-muted-foreground"
                >
                  No rows match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span className="tabular-nums">
          Showing {from.toLocaleString()}–{to.toLocaleString()} of {filtered.toLocaleString()}
          {filtered !== total && ` (filtered from ${total.toLocaleString()})`}
        </span>
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <Select value={String(pageSize)} onValueChange={(v) => table.setPageSize(Number(v))}>
            <SelectTrigger size="sm" className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[25, 50, 100, 250].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="tabular-nums">
            Page {pageIndex + 1} of {Math.max(1, table.getPageCount())}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card size="sm" className="gap-0 py-3">
      <CardContent>
        <div className="text-2xl font-semibold tabular-nums">{value.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  )
}
