import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function ErrorAlert({ message }: { message: string | undefined }) {
  return (
    <Alert variant={'destructive'}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message ?? 'An error has occurred'}</AlertDescription>
    </Alert>
  )
}
