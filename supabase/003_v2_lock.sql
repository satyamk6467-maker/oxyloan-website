-- OXYLOAN v2: the contract swaps on PancakeSwap and locks the OXYLOAN itself (10% unlocks per day, claimed on-chain).
-- Run once in Supabase -> SQL Editor BEFORE switching the site to the v2 contract. Safe to run more than once.
--
-- v2 investments store their locked OXYLOAN in oxyloan_locked and NEVER in oxyloan_allocated,
-- so the old off-chain claim (claimable_amount) and the old swap worker can never pay them a second time.

alter table investments add column if not exists oxyloan_locked numeric(78,0);  -- null = v1 investment

drop index if exists investments_pending_swap_idx;
create index if not exists investments_pending_swap_idx on investments (id) where swap_batch_id is null and oxyloan_locked is null;

create or replace function admin_summary() returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'total_raised',      coalesce(sum(amount),0)::text,
    'management_total',  coalesce(sum(management_amount),0)::text,
    'referral_total',    coalesce(sum(referral_amount),0)::text,
    'swap_total',        coalesce(sum(swap_amount),0)::text,
    'oxyloan_allocated', coalesce(sum(oxyloan_allocated),0)::text,
    'oxyloan_locked',    coalesce(sum(oxyloan_locked),0)::text,
    'investors',         count(distinct investor),
    'investments',       count(*),
    'pending_swap_usdt', coalesce(sum(swap_amount) filter (where swap_batch_id is null and oxyloan_locked is null),0)::text)
  from investments;
$$;
revoke execute on function admin_summary() from public, anon, authenticated;
grant  execute on function admin_summary() to service_role;
