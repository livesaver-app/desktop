import { If } from '@/utils/if.tsx'
import { Button } from '@/components/ui/button.tsx'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion.tsx'
import { CheckCircleIcon, ClockIcon, FolderIcon, XCircleIcon } from 'lucide-react'
import { getFileNameFromPath, openFolder } from '@/utils/file-utils.tsx'
import { Progress } from './ui/progress'
import { IProgress } from '@/hooks/use-progress.tsx'

interface IProgressBarProps {
  process: string
  isRunning: boolean
  progress: IProgress | undefined
  log: IProgress[]
  restart: () => void
}

export const ProgressBar = ({ process, progress, log, restart, isRunning }: IProgressBarProps) => {
  return (
    <>
      <p className={`pt-8 text-muted-foreground ${isRunning && 'animate-pulse'}`}>
        {isRunning ? `${process} in progress` : `${process} finished`}
      </p>
      <If condition={!!progress?.progress && progress.progress > 0}>
        <Progress value={progress?.progress} className="w-full my-4" />
        <span className={'text-gray-400 text-xs font-light'}>{progress?.file_name}</span>
      </If>
      <If condition={!isRunning}>
        <div className="flex space-x-8">
          <Button className="my-4" onClick={restart}>
            Export another one!
          </Button>
        </div>
      </If>
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Process log</AccordionTrigger>
          <AccordionContent>
            {log.map((logItem, index) => (
              <LogCard log={logItem} index={index} />
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  )
}

function LogCard({ log, index }: { log: IProgress; index: number }) {
  return (
    <div key={index} className="p-3 flex items-start">
      <div className="mt-0.5 mr-3">
        {!log.is_error || !log.is_skipped ? (
          <CheckCircleIcon className="w-4 h-4 text-green-500" />
        ) : log.is_error ? (
          <XCircleIcon className="w-4 h-4 text-red-500" />
        ) : (
          <ClockIcon className="w-4 h-4 text-yellow-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-sm truncate">{getFileNameFromPath(log.file_name)}</p>
      </div>
      {log.error_message && <p className="text-xs text-gray-500 mt-1">{log.error_message}</p>}
      <FolderIcon
        onClick={async () => await openFolder(log.file_name)}
        className={'w-4 h-4 text-gray-400 cursor-pointer'}
      />
    </div>
  )
}
