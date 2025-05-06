import {If} from '@/utils/if.tsx'
import {Button} from '@/components/ui/button.tsx'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion.tsx'
import {CheckCircleIcon, ClockIcon, FolderIcon, XCircleIcon} from 'lucide-react'
import {getFileNameFromPath, openFolder} from '@/utils/file-utils.tsx'
import {Progress} from './ui/progress'
import {IProgress} from '@/hooks/use-progress.tsx'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle, DrawerTrigger
} from "@/components/ui/drawer.tsx";
import {Card, CardContent} from "@/components/ui/card.tsx";
import {Alert} from "@/components/ui/alert.tsx";
import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";

interface IProgressBarProps {
  process: string
  isRunning: boolean
  progress: IProgress | undefined
  log: IProgress[]
  restart: () => void
}

export const ProgressBar = ({process, progress, log, restart, isRunning}: IProgressBarProps) => {
  const errorCount = log.filter(l => l.is_error).length
  const skippedCount = log.filter(l => l.is_skipped).length
  const successCount = log.length - errorCount - skippedCount
  return (
    <>
      <p className={`pt-8 text-muted-foreground ${isRunning && 'animate-pulse'}`}>
        {isRunning ? `${process} in progress` : `${process} finished`}
      </p>
      <If condition={!!progress?.progress && progress.progress > 0}>
        <Progress value={progress?.progress} className="w-full my-4"/>
        <If condition={isRunning}>
          <span className={'text-gray-400 text-xs font-light'}>{progress?.file_name}</span>
        </If>
      </If>
      <Card className={"p-4 my-12"}>
        <CardContent className={"flex py-4 justify-between items-center"}>
          <div className={"text-sm font-medium"}>Success: {successCount}</div>
          <div className={"text-sm font-medium"}>Error: {errorCount}</div>
          <div className={"text-sm font-medium"}>Skipped: {skippedCount}</div>
        </CardContent>
      </Card>
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Process log</AccordionTrigger>
          <AccordionContent>
            <ProcessLogTable logs={log}/>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <If condition={!isRunning}>
        <div className="flex space-x-8">
          <Button className="my-12" onClick={restart}>
            Restart
          </Button>
        </div>
      </If>
    </>
  )
}

function ErrorMessage({error_msg, file_name}: { error_msg: string, file_name: string }) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="link">Click to see error message.</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full">
          <DrawerHeader>
            <DrawerTitle className={"max-w-sm mx-auto"}>Run failed</DrawerTitle>
            <DrawerDescription className={"flex py-4 mx-auto max-w-xl flex-col"}>The project {file_name} failed with
              error:
              <Alert variant={"destructive"} className={"p-4 text-xs my-2"}>
                {error_msg}
              </Alert>
            </DrawerDescription>
          </DrawerHeader>

          <DrawerFooter className={"max-w-xs mx-auto"}>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function ProcessLogTable({logs}: { logs: IProgress[] }) {
  const getStatus = (log: IProgress) => {
    return !log.is_error && !log.is_skipped ? (
      <CheckCircleIcon className="w-4 h-4 text-green-500"/>
    ) : log.is_error ? (
      <XCircleIcon className="w-4 h-4 text-red-500"/>
    ) : (
      <ClockIcon className="w-4 h-4 text-yellow-500"/>
    )
  }
  return (
    <Table>
      <TableCaption>A list of all processed project files.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Project name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Message</TableHead>
          <TableHead className="text-right">Project folder</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map(log => (
          <TableRow>
            <TableCell className="font-medium">{getFileNameFromPath(log.file_name)}</TableCell>
            <TableCell>{getStatus(log)}</TableCell>
            <TableCell>{log.error_msg ?
              <ErrorMessage error_msg={log.error_msg}
                            file_name={getFileNameFromPath(log.file_name)}/> : "Success"}</TableCell>
            <TableCell className="text-right">
              <div className={"flex justify-end"}>
                <FolderIcon
                  onClick={async () => await openFolder(log.file_name)}
                  className={'w-4 h-4 text-gray-400 cursor-pointer'}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}