import type { ComponentType } from "react"
import {
  BarChart3Icon,
  CalendarDaysIcon,
  CalendarPlusIcon,
  MailIcon,
  ScanLineIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { href, type Route } from "@/lib/router"

interface NavItem {
  title: string
  icon: ComponentType
  route?: Route // items without a route are planned but not built yet
  badge?: string | number
}

export function AppSidebar({ route, eventCount }: { route: Route; eventCount: number }) {
  const groups: { label: string; items: NavItem[] }[] = [
    {
      label: "Events",
      items: [
        { title: "All events", icon: CalendarDaysIcon, route: "/events", badge: eventCount || undefined },
        { title: "Create event", icon: CalendarPlusIcon, route: "/events/new" },
      ],
    },
    {
      label: "Guests",
      items: [
        { title: "Guest list", icon: UsersIcon, route: "/guests" },
        { title: "Check-in", icon: ScanLineIcon },
        { title: "Email guests", icon: MailIcon },
      ],
    },
    {
      label: "Insights",
      items: [{ title: "Analytics", icon: BarChart3Icon }],
    },
  ]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href={href("/events")}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground">
                  L
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold">Leader</span>
                  <span className="truncate text-xs text-muted-foreground">Event manager</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <NavLink key={item.title} item={item} active={item.route === route} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <NavLink item={{ title: "Settings", icon: SettingsIcon }} active={false} />
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  if (!item.route) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton disabled tooltip={`${item.title} (coming soon)`} className="opacity-60">
          <Icon />
          <span>{item.title}</span>
        </SidebarMenuButton>
        <SidebarMenuBadge className="text-[10px] font-normal text-muted-foreground">Soon</SidebarMenuBadge>
      </SidebarMenuItem>
    )
  }
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
        <a href={href(item.route)} aria-current={active ? "page" : undefined}>
          <Icon />
          <span>{item.title}</span>
        </a>
      </SidebarMenuButton>
      {item.badge !== undefined && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
    </SidebarMenuItem>
  )
}
