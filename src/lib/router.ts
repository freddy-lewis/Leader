import { useEffect, useState } from "react"

export type Route = "/events" | "/events/new" | "/guests"

export const ROUTES: Route[] = ["/events", "/events/new", "/guests"]
const DEFAULT_ROUTE: Route = "/events"

function read(): Route {
  const path = window.location.hash.replace(/^#/, "")
  return (ROUTES as string[]).includes(path) ? (path as Route) : DEFAULT_ROUTE
}

/** Tiny hash router: keeps pages linkable and the back button working without a router library. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(read)
  useEffect(() => {
    const onChange = () => setRoute(read())
    window.addEventListener("hashchange", onChange)
    return () => window.removeEventListener("hashchange", onChange)
  }, [])
  return route
}

export function navigate(route: Route) {
  window.location.hash = route
}

export const href = (route: Route) => `#${route}`
