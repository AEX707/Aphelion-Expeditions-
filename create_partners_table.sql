create table partners (
  id uuid primary key references auth.users(id) on delete cascade,
  company_name text not null,
  contact_person text,
  email text not null,
  country text,
  message text,
  status text not null default 'pending',
  created_at timestamp with time zone default now()
);

alter table partners enable row level security;

-- a partner can read and update only their own row
create policy "Partners can view their own profile"
  on partners for select
  using (auth.uid() = id);

create policy "Partners can update their own profile"
  on partners for update
  using (auth.uid() = id);

-- anyone signing up can create their own partner profile
create policy "Users can insert their own partner profile"
  on partners for insert
  with check (auth.uid() = id);
