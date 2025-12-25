-- Generic function to increment any stat safely
create or replace function increment_user_stat(x_user_id uuid, x_stat_column text, x_amount numeric)
returns void
language plpgsql
security definer
as $$
begin
  execute format('update user_stats set %I = coalesce(%I, 0) + $1 where user_id = $2', x_stat_column, x_stat_column)
  using x_amount, x_user_id;
end;
$$;

