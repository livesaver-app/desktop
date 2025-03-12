export type Profile = {
  created_at: string
  name: string
  user_id: string
  stripe_customer_id: string
  subscription_plan: 'free' | 'premium'
  updated_at: string
}
