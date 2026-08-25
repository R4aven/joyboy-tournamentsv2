
# SQL Supabase pour 1V1 Direct JOYBOY

Copie ça dans Supabase SQL editor.

```sql
-- Table profiles (si pas déjà)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  city text,
  bio text,
  matches_played int default 0,
  wins int default 0,
  losses int default 0,
  tournaments_won int default 0,
  wins_1v1 int default 0,
  palmares jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

-- Table challenges_1v1
create table if not exists challenges_1v1 (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references profiles(id) on delete cascade,
  challenged_id uuid not null references profiles(id) on delete cascade,
  statut text not null default 'EN_ATTENTE' check (statut in ('EN_ATTENTE','ACCEPTE','PAIEMENT_EN_COURS','PAIEMENT_PARTIEL','CONFIRME','EN_COURS','RESULTAT_EN_ATTENTE','TERMINE','CONTESTE','REFUSE','ANNULE')),
  date_match date,
  heure_match time,
  reglement text,
  message text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  paiement_challenger boolean default false,
  paiement_challenged boolean default false,
  preuve_challenger_url text,
  preuve_challenged_url text,
  paiement_confirme_admin boolean default false,
  declaration_challenger uuid references profiles(id),
  declaration_challenged uuid references profiles(id),
  gagnant_id uuid references profiles(id),
  contestation_raison text
);

-- Index
create index idx_challenges_challenger on challenges_1v1(challenger_id);
create index idx_challenges_challenged on challenges_1v1(challenged_id);
create index idx_challenges_statut on challenges_1v1(statut);

-- Storage bucket payments
insert into storage.buckets (id, name, public) values ('payments', 'payments', true)
on conflict (id) do nothing;

-- RLS (à adapter)
alter table profiles enable row level security;
alter table challenges_1v1 enable row level security;

create policy "public can read profiles" on profiles for select using (true);
create policy "users can update own profile" on profiles for update using (auth.uid() = id);

create policy "users can read own challenges" on challenges_1v1 for select using (auth.uid() = challenger_id or auth.uid() = challenged_id);
create policy "users can insert challenges" on challenges_1v1 for insert with check (auth.uid() = challenger_id);
create policy "users can update own challenges" on challenges_1v1 for update using (auth.uid() = challenger_id or auth.uid() = challenged_id);

create policy "public can upload payment proofs" on storage.objects for insert with check (bucket_id = 'payments');
create policy "public can read payment proofs" on storage.objects for select using (bucket_id = 'payments');
```

Wave: 01 51 42 99 18
WhatsApp: 07 48 23 52 26
Mise: 500 FCFA par joueur
