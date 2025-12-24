-- Function to purchase an item ensuring sufficient gold
-- Returns the new gold balance if successful, or -1 if insufficient funds

create or replace function purchase_item(x_user_id uuid, x_price int)
returns integer
language plpgsql
security definer
as $$
declare
  current_gold integer;
  new_gold integer;
begin
  -- Get current gold
  select gold into current_gold
  from user_stats
  where user_id = x_user_id;

  -- Check if user exists
  if current_gold is null then
    raise exception 'User not found';
  end if;

  -- Check sufficient funds
  if current_gold < x_price then
    return -1; -- Insufficient funds code
  end if;

  -- Deduct gold
  update user_stats
  set gold = gold - x_price
  where user_id = x_user_id
  returning gold into new_gold;
  
  return new_gold;
end;
$$;
