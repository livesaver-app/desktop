import { createClient } from 'jsr:@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0'

// Load environment variables
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') as string
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

console.log('🌍 Stripe Webhook is running...')

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
})

// This is needed in order to use the Web Crypto API in Deno.
const cryptoProvider = Stripe.createSubtleCryptoProvider()

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text()

  try {
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      WEBHOOK_SECRET,
      undefined,
      cryptoProvider
    )

    console.log(`Received event: ${event.type}`)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        await supabase
          .from('profiles')
          .update({
            subscription_plan: 'premium',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', session.customer)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        await supabase
          .from('profiles')
          .update({
            subscription_plan: 'free',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', subscription.customer)
        break
      }
    }

    console.log('✅ Webhook processed successfully')
    return new Response(JSON.stringify({ received: true }))
  } catch (error) {
    console.error('Error in stripe-webhook:', error.message)
    return new Response(JSON.stringify({ error: error.message }))
  }
})
