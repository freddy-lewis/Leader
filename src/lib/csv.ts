/**
 * Minimal RFC 4180 CSV parser: handles quoted fields, escaped quotes ("")
 * and newlines inside quotes. Returns an array of rows (arrays of strings).
 */
export function parseCSV(input: string): string[][] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input // strip BOM

  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ",") {
      row.push(field)
      field = ""
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++
      row.push(field)
      field = ""
      rows.push(row)
      row = []
    } else {
      field += c
    }
  }
  if (field !== "" || row.length) {
    row.push(field)
    rows.push(row)
  }

  // Drop fully blank lines (e.g. a trailing newline)
  return rows.filter((r) => !(r.length === 1 && r[0] === ""))
}

export function toCSV(header: string[], rows: string[][]): string {
  const esc = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  return [header, ...rows].map((r) => r.map((v) => esc(v ?? "")).join(",")).join("\r\n")
}

export interface Dataset {
  fileName: string
  header: string[]
  rows: string[][]
}

/** Parse a CSV string into a header plus rows padded/trimmed to the header width. */
export function toDataset(fileName: string, text: string): Dataset {
  const data = parseCSV(text)
  if (data.length === 0 || data[0].length === 0) throw new Error("The file is empty.")
  const header = data[0]
  const width = header.length
  const rows = data.slice(1).map((r) =>
    r.length < width ? r.concat(Array(width - r.length).fill("")) : r.slice(0, width),
  )
  return { fileName, header, rows }
}
