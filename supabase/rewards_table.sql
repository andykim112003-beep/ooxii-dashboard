-- Rewards catalog for the Rewards screen + admin "Manage rewards" page.
-- This table doesn't exist yet - run this once in the Supabase SQL editor
-- (Project > SQL Editor) before deploying this branch. The app reads and
-- writes to this table directly using the anon key, same as points_ledger.

create table if not exists rewards (
  id bigint generated always as identity primary key,
  name text not null,
  description text not null default '',
  cost integer not null,
  icon text not null default '🎁',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table rewards enable row level security;

drop policy if exists "rewards_select_all" on rewards;
create policy "rewards_select_all" on rewards
  for select using (true);

drop policy if exists "rewards_write_all" on rewards;
create policy "rewards_write_all" on rewards
  for all using (true) with check (true);

-- Seed the original 14 rewards, but only if the table is still empty so
-- this script is safe to re-run.
insert into rewards (name, description, cost, icon)
select * from (values
  ('Airtime / mobile data top-up', 'Top up your mobile phone with airtime or data at any local provider.', 50, '📱'),
  ('Food / staple voucher', 'A voucher for staple foods, redeemable at partnered local stores.', 50, '🛒'),
  ('OOXii notebook & pen kit', 'A branded notebook and pen set for recording your fieldwork.', 50, '📓'),
  ('Solar phone charger / torch', 'A solar-powered charger and torch, handy where power is unreliable.', 100, '☀️'),
  ('First aid / hygiene pack', 'A basic first aid and hygiene kit for outreach visits.', 120, '🩹'),
  ('OOXii tester kit bag', 'A durable bag to carry your testing equipment and supplies.', 130, '🎒'),
  ('Local transport contribution', 'Money towards buses, fuel or other transport to reach testing sites.', 150, '🚌'),
  ('Paid training / certification access', 'Access to a paid training course or certification in eye care.', 200, '📜'),
  ('Community health conference attendance', 'A funded place at a community health conference.', 230, '🏥'),
  ('Named contribution on OOXii''s website', 'Your name featured as a contributor on the OOXii website.', 250, '📰'),
  ('Certificate of recognition', 'An official certificate recognising your work as a tester.', 300, '🏅'),
  ('Priority access to new equipment', 'First access to new testing equipment as it becomes available.', 320, '🔬'),
  ('Regional community health award nomination', 'Nomination for a regional award recognising community health work.', 350, '🏆'),
  ('Donation made in tester''s name', 'A charitable donation made in your name to a health-related cause.', 400, '❤️')
) as seed(name, description, cost, icon)
where not exists (select 1 from rewards);
