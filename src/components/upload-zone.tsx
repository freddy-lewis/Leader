import { useRef, useState } from "react"
import { UploadIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { toDataset, type Dataset } from "@/lib/csv"

export function UploadZone({ onLoad }: { onLoad: (data: Dataset) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      setError("That doesn’t look like a CSV file.")
      return
    }
    try {
      onLoad(toDataset(file.name, await file.text()))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t read the file.")
    }
  }

  return (
    <div className="mx-auto mt-[12vh] max-w-xl text-center">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFile(e.dataTransfer.files[0])
        }}
        className={cn(
          "flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed bg-card px-6 py-14 text-muted-foreground transition-colors",
          "hover:border-primary/60 hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          dragging && "border-primary bg-muted",
        )}
      >
        <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-muted">
          <UploadIcon className="size-5 text-foreground" />
        </div>
        <span className="text-base font-medium text-foreground">Drop a CSV file here</span>
        <span className="text-sm">or click to choose one</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0])
          e.target.value = ""
        }}
      />
      <p className="mt-4 text-sm text-muted-foreground">
        Guests are saved to the Leader database on this computer, not sent to any outside service.
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
