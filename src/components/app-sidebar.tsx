import * as React from 'react'
import { ClipboardCopy, House, ArrowRightLeft, Send } from 'lucide-react'
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
      icon: House
    },
    {
      title: 'Feedback',
      url: 'https://github.com/livesaver-io/desktop/issues',
      icon: Send
    }
  ],
  projects: [
    // {
    //   name: 'Dashboard',
    //   url: '/',
    //   icon: House,
    //   disabled: false
    // },
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
      disabled: false
    }
    /* {
       name: 'Backup',
       url: 'backup',
       icon: Map,
       disabled: true
     }*/
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
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">LiveSaver</span>
                </div>
                <ModeToggle />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={data.projects} />
        {/*<NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
