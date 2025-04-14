import * as React from 'react'
import { Command, ClipboardCopy, LifeBuoy, Map, ArrowRightLeft, Send } from 'lucide-react'
import { NavProjects } from '@/components/nav-projects'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'
import { ModeToggle } from '@/components/mode-toggle.tsx'
import { NavUser } from './nav-user'

const data = {
  navSecondary: [
    {
      title: 'Support',
      url: 'https://github.com/livesaver-io/desktop/issues',
      icon: LifeBuoy
    },
    {
      title: 'Feedback',
      url: 'https://github.com/livesaver-io/desktop/issues',
      icon: Send
    }
  ],
  projects: [
    {
      name: 'Dashboard',
      url: '/',
      icon: LifeBuoy,
      disabled: false
    },
    {
      name: 'Copify',
      url: '/copify',
      icon: ClipboardCopy,
      disabled: false
    },
    {
      name: 'Mover',
      url: '/mover',
      icon: ArrowRightLeft,
      disabled: true
    },
    {
      name: 'Backup',
      url: 'backup',
      icon: Map,
      disabled: true
    }
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className={'flex my-2 items-center justify-between h-full'}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Ableton</span>
                  <span className="truncate text-xs">LiveSaver</span>
                </div>
                <ModeToggle />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={data.projects} />
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
