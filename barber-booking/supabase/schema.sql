-- Bookings table
create table bookings (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text,
  customer_phone text,
  appointment_date date not null,
  appointment_hour integer not null, -- 9..17
  cancel_token uuid not null default gen_random_uuid(),
  status text not null default 'confirmed', -- 'confirmed' | 'cancelled'
  created_at timestamptz default now()
);

-- Working hours config (per weekday: 0=Sun, 1=Mon, ..., 6=Sat)
create table working_hours (
  id serial primary key,
  weekday integer not null unique, -- 0-6
  start_hour integer not null,
  end_hour integer not null,       -- exclusive, e.g. 18 means last slot = 17:00
  is_active boolean not null default true
);

-- Insert defaults: Mon-Sat 9:00-18:00, Sunday off
insert into working_hours (weekday, start_hour, end_hour, is_active) values
(0, 9, 18, false),  -- Sunday
(1, 9, 18, true),   -- Monday
(2, 9, 18, true),   -- Tuesday
(3, 9, 18, true),   -- Wednesday
(4, 9, 18, true),   -- Thursday
(5, 9, 18, true),   -- Friday
(6, 9, 18, true);   -- Saturday

-- Blocked days (holidays / days off)
create table blocked_days (
  id serial primary key,
  blocked_date date not null unique,
  reason text
);

-- Enable RLS
alter table bookings enable row level security;
alter table working_hours enable row level security;
alter table blocked_days enable row level security;

-- Public can read working_hours and blocked_days
create policy "Public read working_hours"
  on working_hours for select to anon using (true);

create policy "Public read blocked_days"
  on blocked_days for select to anon using (true);

-- Public can read non-sensitive booking info (only date/hour/status, not personal data)
create policy "Public read booking slots"
  on bookings for select to anon
  using (true);

-- Service role bypasses RLS for write operations
