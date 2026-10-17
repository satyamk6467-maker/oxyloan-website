-- OXYLOAN database. Run once in Supabase -> SQL Editor.
-- Security model: Row Level Security is ON for every table and NO public policies exist,
-- so the public (anon) key can read/write NOTHING. Only the server, using the secret service_role key, can.

create table if not exists investments (
  id               bigserial primary key,
  tx_hash          text        not null,
  log_index        int         not null,
  block_number     bigint      not null,
  investment_id    bigint      not null,           -- id emitted by the contract
  investor         text        not null,           -- lowercase 0x address
  referrer         text,
  amount           numeric(78,0) not null,         -- USDT, 18 decimals (wei)
  management_amount numeric(78,0) not null,
  referral_amount  numeric(78,0) not null default 0,
  swap_amount      numeric(78,0) not null,
  oxyloan_allocated numeric(78,0) not null default 0, -- OXYLOAN credited after the PancakeSwap swap
  swap_batch_id    bigint,
  created_at       timestamptz not null default now(),
  unique (tx_hash, log_index)
);
create index if not exists investments_investor_idx on investments (investor);
create index if not exists investments_referrer_idx on investments (referrer);
create index if not exists investments_block_idx on investments (block_number desc);
create index if not exists investments_pending_swap_idx on investments (id) where swap_batch_id is null;

create table if not exists referrals (
  investor     text primary key,
  referrer     text not null,
  tx_hash      text not null,
  block_number bigint not null,
  created_at   timestamptz not null default now()
);
create index if not exists referrals_referrer_idx on referrals (referrer);

-- every referral bonus that was paid (paid on-chain, directly to the referrer, in the same transaction as the investment)
create table if not exists referral_bonuses (
  id           bigserial primary key,
  tx_hash      text not null,
  log_index    int  not null,
  block_number bigint not null,
  referrer     text not null,
  investor     text not null,
  amount       numeric(78,0) not null,
  created_at   timestamptz not null default now(),
  unique (tx_hash, log_index)
);
create index if not exists bonuses_referrer_idx on referral_bonuses (referrer);

create table if not exists swap_batches (
  id          bigserial primary key,
  tx_hash     text not null unique,
  usdt_in     numeric(78,0) not null,
  oxyloan_out numeric(78,0) not null,
  created_at  timestamptz not null default now()
);

create table if not exists sync_state (
  id         int primary key,
  last_block bigint not null,
  updated_at timestamptz not null default now()
);

-- ---------- lock everything down ----------
alter table investments      enable row level security;
alter table referrals        enable row level security;
alter table referral_bonuses enable row level security;
alter table swap_batches     enable row level security;
alter table sync_state       enable row level security;
revoke all on investments, referrals, referral_bonuses, swap_batches, sync_state from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- ---------- read helpers (called only by the server) ----------
create or replace function public_stats() returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'total_raised', coalesce(sum(amount),0)::text,
    'investors',    count(distinct investor),
    'investments',  count(*))
  from investments;
$$;

create or replace function wallet_summary(p_address text) returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'invested',         coalesce((select sum(amount) from investments where investor = p_address),0)::text,
    'oxyloan_credited', coalesce((select sum(oxyloan_allocated) from investments where investor = p_address),0)::text,
    'referral_earned',  coalesce((select sum(amount) from referral_bonuses where referrer = p_address),0)::text,
    'referral_count',   (select count(*) from referrals where referrer = p_address),
    'referred_volume',  coalesce((select sum(amount) from investments where referrer = p_address),0)::text,
    'investments', coalesce((select json_agg(x) from (
        select tx_hash, amount::text as amount, oxyloan_allocated::text as oxyloan, block_number, created_at
        from investments where investor = p_address order by block_number desc limit 20) x), '[]'::json));
$$;

create or replace function admin_summary() returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'total_raised',      coalesce(sum(amount),0)::text,
    'management_total',  coalesce(sum(management_amount),0)::text,
    'referral_total',    coalesce(sum(referral_amount),0)::text,
    'swap_total',        coalesce(sum(swap_amount),0)::text,
    'oxyloan_allocated', coalesce(sum(oxyloan_allocated),0)::text,
    'investors',         count(distinct investor),
    'investments',       count(*),
    'pending_swap_usdt', coalesce(sum(swap_amount) filter (where swap_batch_id is null),0)::text)
  from investments;
$$;

create or replace function admin_top_referrers() returns json language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(x),'[]'::json) from (
    select referrer, count(distinct investor) as referred, sum(amount)::text as bonus_total
    from referral_bonuses group by referrer order by sum(amount) desc limit 20) x;
$$;

-- only the server (service_role) may run these
revoke execute on function public_stats(), wallet_summary(text), admin_summary(), admin_top_referrers() from public, anon, authenticated;
grant  execute on function public_stats(), wallet_summary(text), admin_summary(), admin_top_referrers() to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- ---------- swap bookkeeping (called by the swap worker) ----------
-- Atomically records a PancakeSwap batch and credits the received OXYLOAN to the investments in it, pro rata by USDT swapped.
create or replace function allocate_swap(p_tx_hash text, p_usdt_in numeric, p_oxyloan_out numeric, p_ids bigint[])
returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_batch bigint;
  v_total numeric;
begin
  select coalesce(sum(swap_amount),0) into v_total from investments where id = any(p_ids) and swap_batch_id is null;
  if v_total = 0 then raise exception 'nothing to allocate'; end if;
  insert into swap_batches(tx_hash, usdt_in, oxyloan_out) values (p_tx_hash, p_usdt_in, p_oxyloan_out) returning id into v_batch;
  update investments
     set oxyloan_allocated = floor(p_oxyloan_out * swap_amount / v_total), swap_batch_id = v_batch
   where id = any(p_ids) and swap_batch_id is null;
  return v_batch;
end $$;
revoke execute on function allocate_swap(text, numeric, numeric, bigint[]) from public, anon, authenticated;
grant  execute on function allocate_swap(text, numeric, numeric, bigint[]) to service_role;


-- =====================================================================
-- claims (same content as 002_claims.sql, included so a fresh install needs only this file)
-- =====================================================================
-- OXYLOAN claims: lets investors withdraw the OXYLOAN credited to them to their own wallet.
-- Safe to run more than once. Run in Supabase -> SQL Editor (or with the apply script in SETUP.md).

create table if not exists claims (
  id         bigserial primary key,
  investor   text not null,                       -- lowercase 0x address; tokens are ONLY ever sent to this address
  amount     numeric(78,0) not null check (amount > 0),   -- OXYLOAN, 18 decimals (wei)
  status     text not null default 'pending' check (status in ('pending','sending','sent','failed')),
  tx_hash    text,
  error      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists claims_investor_idx on claims (investor);
create index if not exists claims_open_idx on claims (id) where status in ('pending','sending');

alter table claims enable row level security;
revoke all on claims from anon, authenticated;
revoke all on sequence claims_id_seq from anon, authenticated;
grant all on claims to service_role;
grant all on sequence claims_id_seq to service_role;

-- credited OXYLOAN minus everything already claimed or being paid. Only a 'failed' claim frees its amount again.
create or replace function claimable_amount(p_investor text) returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce((select sum(oxyloan_allocated) from investments where investor = p_investor), 0)
       - coalesce((select sum(amount) from claims where investor = p_investor and status <> 'failed'), 0);
$$;

-- Atomic: an advisory lock per investor means two simultaneous requests can never claim the same tokens twice.
create or replace function request_claim(p_investor text, p_min numeric default 0) returns json
language plpgsql security definer set search_path = public as $$
declare
  v numeric;
  v_id bigint;
begin
  perform pg_advisory_xact_lock(hashtext('claim:' || p_investor));
  v := claimable_amount(p_investor);
  if v <= 0 or v < p_min then
    raise exception 'nothing to claim';
  end if;
  insert into claims (investor, amount) values (p_investor, v) returning id into v_id;
  return json_build_object('id', v_id, 'amount', v::text);
end $$;

create or replace function wallet_summary(p_address text) returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'invested',         coalesce((select sum(amount) from investments where investor = p_address),0)::text,
    'oxyloan_credited', coalesce((select sum(oxyloan_allocated) from investments where investor = p_address),0)::text,
    'referral_earned',  coalesce((select sum(amount) from referral_bonuses where referrer = p_address),0)::text,
    'referral_count',   (select count(*) from referrals where referrer = p_address),
    'referred_volume',  coalesce((select sum(amount) from investments where referrer = p_address),0)::text,
    'claimable',        claimable_amount(p_address)::text,
    'claim_pending',    coalesce((select sum(amount) from claims where investor = p_address and status in ('pending','sending')),0)::text,
    'claimed',          coalesce((select sum(amount) from claims where investor = p_address and status = 'sent'),0)::text,
    'investments', coalesce((select json_agg(x) from (
        select tx_hash, amount::text as amount, oxyloan_allocated::text as oxyloan, block_number, created_at
        from investments where investor = p_address order by block_number desc limit 20) x), '[]'::json),
    'claims', coalesce((select json_agg(c) from (
        select id, amount::text as amount, status, tx_hash, created_at
        from claims where investor = p_address order by id desc limit 10) c), '[]'::json));
$$;

create or replace function admin_summary() returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'total_raised',      coalesce(sum(amount),0)::text,
    'management_total',  coalesce(sum(management_amount),0)::text,
    'referral_total',    coalesce(sum(referral_amount),0)::text,
    'swap_total',        coalesce(sum(swap_amount),0)::text,
    'oxyloan_allocated', coalesce(sum(oxyloan_allocated),0)::text,
    'investors',         count(distinct investor),
    'investments',       count(*),
    'pending_swap_usdt', coalesce(sum(swap_amount) filter (where swap_batch_id is null),0)::text,
    'claims_pending',    (select count(*) from claims where status = 'pending'),
    'claims_stuck',      (select count(*) from claims where status = 'sending'),
    'claims_sent_total', coalesce((select sum(amount) from claims where status = 'sent'),0)::text,
    'claims_open_oxyloan', coalesce((select sum(amount) from claims where status in ('pending','sending')),0)::text)
  from investments;
$$;

revoke execute on function claimable_amount(text), request_claim(text, numeric), wallet_summary(text), admin_summary() from public, anon, authenticated;
grant  execute on function claimable_amount(text), request_claim(text, numeric), wallet_summary(text), admin_summary() to service_role;
