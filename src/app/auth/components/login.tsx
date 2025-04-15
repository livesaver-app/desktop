import { useState } from 'react'
import { supabase } from '@/supabaseClient'
import { open } from '@tauri-apps/plugin-shell'
// import { invoke } from '@tauri-apps/api/core'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form.tsx'
import { appUrl } from '@/lib/constants'

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [_, setLoading] = useState(false)
  // const [port, setPort] = useState<number | null>(null)

  const formSchema = z.object({
    username: z.string().min(1, {
      message: 'You need to provide a username or phone.'
    }),
    password: z.string().min(1, {
      message: 'You need to provide a password.'
    })
  })
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema)
  })

  // useEffect(() => {
  //   const unlisten = listen('oauth://url', (data) => {
  //     console.log('LISTENER', data)
  //     if (!data.payload) return
  //
  //     const url = new URL(data.payload as string)
  //     const code = new URLSearchParams(url.search).get('code')
  //
  //     console.log('here', data.payload, code)
  //     if (code) {
  //       supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
  //         if (error) {
  //           alert(error.message)
  //           console.error(error)
  //           return
  //         }
  //         location.reload()
  //       })
  //     }
  //
  //     console.log('STOPPING')
  //   })
  //
  //   startServerRust()
  //   return () => {
  //     unlisten?.then((u) => u())
  //     stopCurrentServer()
  //   }
  // }, [])

  const handleLogin = async (values: z.infer<typeof formSchema>) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.username,
        password: values.password
      })
      if (error) {
        alert(error.message)
      }
    } catch (error) {
      console.error('Error logging in:', error)
    }
    setLoading
  }

  // const onProviderLogin = (provider: 'github') => async () => {
  //   setLoading(true)
  //   try {
  //     const { data, error } = await supabase.auth.signInWithOAuth({
  //       options: {
  //         skipBrowserRedirect: true,
  //         scopes: '',
  //         redirectTo: `http://localhost:${port}`
  //       },
  //       provider: provider
  //     })
  //
  //     if (data.url) {
  //       open(data.url)
  //     } else {
  //       alert(error?.message)
  //     }
  //     setLoading(false)
  //   } catch (error) {
  //     console.error('Error starting server', error)
  //   }
  // }
  //
  // function stopCurrentServer() {
  //   if (port !== null) {
  //     try {
  //       invoke('stop_server', { port: port })
  //       console.log(`Stopped server on port ${port}`)
  //     } catch (error) {
  //       console.error(`Error stopping server: ${error}`)
  //     }
  //     setPort(null)
  //   }
  // }

  // async function startServerRust() {
  //   stopCurrentServer()
  //   try {
  //     const port = await invoke<number>('start_server')
  //     setPort(port)
  //     return port
  //   } catch (error) {
  //     console.log('rust_error', error)
  //   }
  // }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login to LiveSaver</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLogin)}>
              <div className="flex flex-col gap-2">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="py-4">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="m@example.com" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="py-4">
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Login
                </Button>
                {/* <Button */}
                {/*   onClick={() => onProviderLogin('github')} */}
                {/*   variant="outline" */}
                {/*   className="w-full" */}
                {/* > */}
                {/*   Login with GitHub */}
                {/* </Button> */}
              </div>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{' '}
                <span
                  className="underline underline-offset-4 cursor-pointer"
                  onClick={() => open(appUrl + '/signup')}
                >
                  Sign up
                </span>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
