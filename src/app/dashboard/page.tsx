import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { SidebarWrapper } from '@/components/sidebar'

export function Dashboard() {
  return (
    <SidebarWrapper>
      <div className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">Livesaver</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-4">
          <h2 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
            Welcome to the LiveSaver Dashboard!
          </h2>
          <p className="leading-7 [&:not(:first-child)]:mt-6">
            Thank you for exploring our app! 🚀 Please note that the app is currently in its early
            stages of development, and some features and functionalities are still being refined.
            We’re excited to share that the “Copify” export function is now available for testing!
            We would love to hear your feedback on the user experience and whether the app has
            worked as expected for you.
          </p>
          <h4 className="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight">
            Important Notes:
          </h4>
          <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
            <li>Please use the app at your own risk, as it’s still under active development.</li>
            <li>
              We highly recommend creating a backup of your data before using the Copify feature to
              ensure the safety of your information.
            </li>
          </ul>
          <p>
            Your feedback is invaluable and will help us improve the app. Thank you for being a part
            of this journey and helping us make it better!
          </p>
        </div>
      </div>
    </SidebarWrapper>
  )
}
