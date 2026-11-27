import { useEffect, useState } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useEvents } from "@/lib/events"
import { navigate, useRoute, type Route } from "@/lib/router"
import { CreateEventPage } from "@/pages/create-event-page"
import { EventsPage } from "@/pages/events-page"
import { GuestsPage } from "@/pages/guests-page"

const TITLES: Record<Route, string> = {
  "/events": "All events",
  "/events/new": "Create event",
  "/guests": "Guest list",
}

/** Follow the OS light/dark setting (shadcn themes key off the `.dark` class). */
function useSystemTheme() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const apply = () => document.documentElement.classList.toggle("dark", mq.matches)
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])
}

export default function App() {
  useSystemTheme()
  const route = useRoute()
  const { events, loading, error, reload, addEvent, deleteEvent } = useEvents()
  // Lives here so the open guest list survives switching pages.
  const [openListId, setOpenListId] = useState<string | null>(null)

  useEffect(() => {
    document.title = `${TITLES[route]} · Leader`
  }, [route])

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar route={route} eventCount={events.length} />
        <SidebarInset className="min-w-0">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <span className="text-sm font-medium">{TITLES[route]}</span>
          </header>

          <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6">
            {route === "/events" && (
              <EventsPage events={events} loading={loading} error={error} onRetry={reload} onDelete={deleteEvent} />
            )}
            {route === "/events/new" && (
              <CreateEventPage
                onCreate={async (e) => {
                  await addEvent(e)
                  navigate("/events")
                }}
              />
            )}
            {route === "/guests" && <GuestsPage openId={openListId} onOpen={setOpenListId} />}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
