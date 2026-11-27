# Leader

A small browser-based CSV viewer. Upload a CSV (e.g. an event guest export) and browse it as a table.

## Features

- Drag-and-drop or click to upload a `.csv` file
- Sortable columns (click a header; numbers and dates sort correctly)
- Search across all visible columns
- Filter chips for a status column (e.g. `approval_status`)
- Summary counts per status
- Show/hide columns (empty columns are hidden by default)
- Pagination and export of the current filtered view

The file is parsed entirely in your browser; nothing is uploaded to a server.

## Run it

No build step or dependencies. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.
# Leader
