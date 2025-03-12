-- Enable Stripe integration
create extension if not exists wrappers with schema extensions;
create foreign data wrapper stripe_wrapper
  handler stripe_fdw_handler
  validator stripe_fdw_validator;

create server stripe_server
foreign data wrapper stripe_wrapper
options (
  api_key_name 'stripe'
);

create schema stripe;

-- Stripe customers table
create foreign table stripe.customers (
  id text,
  email text,
  name text,
  description text,
  created timestamp,
  attrs jsonb
)
server stripe_server
options (
  object 'customers',
  rowid_column 'id'
);


-- Function to handle Stripe customer creation
create or replace function public.handle_stripe_customer_creation()
returns trigger
security definer
set search_path = public
as $$
declare
  customer_email text;
begin
  -- Get user email
  select email into customer_email
  from auth.users
  where id = new.user_id;

  -- Create Stripe customer
  insert into stripe.customers (email, name)
  values (customer_email, new.name);
  
  -- Get the created customer ID from Stripe
  select id into new.stripe_customer_id
  from stripe.customers
  where email = customer_email
  order by created desc
  limit 1;
  
  return new;
end;
$$ language plpgsql;

-- Trigger to create Stripe customer on profile creation
create trigger create_stripe_customer_on_profile_creation
  before insert on public.profiles
  for each row
  execute function public.handle_stripe_customer_creation();

-- Function to handle Stripe customer deletion
create or replace function public.handle_stripe_customer_deletion()
returns trigger
security definer
set search_path = public
as $$
begin
  if old.stripe_customer_id is not null then
    begin
      delete from stripe.customers where id = old.stripe_customer_id;
    exception when others then
      -- Log the error if needed, but continue with the deletion
      raise notice 'Failed to delete Stripe customer: %', SQLERRM;
    end;
  end if;
  return old;
end;
$$ language plpgsql;

-- Trigger to delete Stripe customer on profile deletion
create trigger delete_stripe_customer_on_profile_deletion
  before delete on public.profiles
  for each row
  execute function public.handle_stripe_customer_deletion();

-- Security policy: Users can read their own Stripe data
create policy "Users can read own Stripe data"
  on public.profiles
  for select
  using (auth.uid() = user_id);
