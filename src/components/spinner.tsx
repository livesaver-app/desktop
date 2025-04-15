import { Loader2 } from 'lucide-react'

export const Spinner = () => {
  return (
    <div className="h-screen flex justify-center flex-col space-y-4 items-center w-full">
      <Loader2 className="animate-spin mx-2 h-12 w-12" />
      <span className="animate-pulse text-sm">Loading LiveSaver...</span>
    </div>
  )
}
