# Leader

A small event manager. Create events and import guest exports (CSV) to browse them as a table. Everything is stored in a local SQLite database.

## Features

- **Sidebar navigation:** All events, Create event, Guest list (Check-in, Email guests, Analytics and Settings are placeholders marked "Soon")
- **Events:** create (with validation), list as Upcoming / Past / All, delete
- **Guest lists:** import a `.csv` by drag-and-drop or file picker, reopen or delete saved lists
- **Table view:** sortable columns (numbers and dates sort correctly), search across visible columns, status filter and counts (e.g. `approval_status`), show/hide columns (empty ones hidden by default), pagination, export of the current filtered view

## Stack

- **Frontend:** React + TypeScript (Vite), Tailwind CSS v4, shadcn/ui, TanStack Table
- **Backend:** a small Node HTTP API (`server/`) using Node's built-in SQLite (`node:sqlite`), so there are no native packages to install. Requires Node 22.13+.

Events and imported guest lists are stored in `data/leader.db`. That file is git-ignored because it holds guests' personal details, and the API only listens on `127.0.0.1`.

## Run it

```bash
npm install
npm run dev
```

This starts the API on port 3001 and the web app on http://localhost:5173 (Vite forwards `/api` requests to the API).

Other scripts: `npm run build` (production build to `dist/`), `npm run lint`. Set `LEADER_DB` to use a different database file.

## API

| Method | Path | |
|---|---|---|
| GET | `/api/events` | List events |
| POST | `/api/events` | Create an event |
| DELETE | `/api/events/:id` | Delete an event |
| GET | `/api/guest-lists` | List imported guest lists |
| POST | `/api/guest-lists` | Import `{ fileName, header, rows }` |
| GET | `/api/guest-lists/:id` | One list with all rows |
| DELETE | `/api/guest-lists/:id` | Delete a list and its guests |
