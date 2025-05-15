### Useful Supabase commands for development

```cmd
supabase start
```

```cmd
db push --db-url <postgres-con>
```

```sql
insert into vault.secrets (name, secret)
select 'stripe', 'sk_secret'
returning key_id;
```
