-- ============================================================
-- Bella Vista Admin — Schema PostgreSQL (Supabase)
-- ============================================================

-- Helper: verifica se o usuário é admin
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from user_profiles
    where id = auth.uid() and role in ('admin', 'sindico')
  );
$$ language sql security definer stable;

-- ============================================================
-- USER PROFILES
-- ============================================================
create table user_profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  role       text not null default 'morador'
             check (role in ('admin', 'sindico', 'conselho', 'morador')),
  created_at timestamptz not null default now()
);
alter table user_profiles enable row level security;
create policy "Próprio perfil" on user_profiles for select using (id = auth.uid());
create policy "Admin lê tudo" on user_profiles for select using (is_admin());
create policy "Admin altera" on user_profiles for all using (is_admin());

-- ============================================================
-- UNITS (Unidades)
-- ============================================================
create table units (
  id               uuid primary key default gen_random_uuid(),
  number           text not null,
  type             text not null default 'proprio' check (type in ('proprio', 'alugado')),
  responsible      text not null default '',
  responsible_birth text,
  phone            text,
  email            text,
  resident_count   int not null default 0,
  vehicle_count    int not null default 0,
  provider_count   int not null default 0,
  status           text not null default 'aprovado' check (status in ('aprovado', 'aguardando', 'inativo')),
  is_delinquent    boolean not null default false,
  delinquent_date  timestamptz,
  delinquent_by    text,
  is_blocked       boolean not null default false,
  blocked_date     timestamptz,
  notes            text,
  created_at       timestamptz not null default now()
);
alter table units enable row level security;
create policy "Admin CRUD units" on units for all using (is_admin());
create policy "Morador vê sua unidade" on units for select using (
  email = (select email from user_profiles where id = auth.uid())
);

-- ============================================================
-- RESIDENTS (Moradores)
-- ============================================================
create table residents (
  id           uuid primary key default gen_random_uuid(),
  unit_id      uuid not null references units(id) on delete cascade,
  role         text not null default 'dependente'
               check (role in ('proprietario_morador','proprietario_nao_morador','inquilino','dependente','dependente_inquilino')),
  full_name    text not null,
  birth_date   text,
  cpf          text,
  phone        text,
  email        text,
  access_code  text,
  lgpd_consent boolean not null default false,
  status       text not null default 'aguardando' check (status in ('aprovado', 'aguardando', 'inativo')),
  notes        text,
  created_at   timestamptz not null default now()
);
alter table residents enable row level security;
create policy "Admin CRUD residents" on residents for all using (is_admin());
create policy "Morador vê seu apto" on residents for select using (
  unit_id in (select id from units where email = (select email from user_profiles where id = auth.uid()))
);

-- ============================================================
-- VEHICLES (Veículos)
-- ============================================================
create table vehicles (
  id           uuid primary key default gen_random_uuid(),
  unit_id      uuid not null references units(id) on delete cascade,
  responsible  text not null default '',
  type         text,
  model        text,
  color        text,
  plate        text,
  status       text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at   timestamptz not null default now()
);
alter table vehicles enable row level security;
create policy "Admin CRUD vehicles" on vehicles for all using (is_admin());
create policy "Morador vê seus veículos" on vehicles for select using (
  unit_id in (select id from units where email = (select email from user_profiles where id = auth.uid()))
);

-- ============================================================
-- SERVICE PROVIDERS (Prestadores)
-- ============================================================
create table service_providers (
  id                    uuid primary key default gen_random_uuid(),
  unit_id               uuid not null references units(id) on delete cascade,
  resident_responsible  text not null default '',
  name                  text not null,
  service_type          text,
  days                  text,
  schedule              text,
  period                text,
  access_code           text,
  status                text not null default 'ativo' check (status in ('ativo', 'aguardando', 'inativo')),
  notes                 text,
  created_at            timestamptz not null default now()
);
alter table service_providers enable row level security;
create policy "Admin CRUD providers" on service_providers for all using (is_admin());

-- ============================================================
-- BUILDING STAFF (Zeladoria)
-- ============================================================
create table building_staff (
  id           uuid primary key default gen_random_uuid(),
  role         text not null,
  full_name    text not null,
  phone        text,
  email        text,
  access_code  text,
  lgpd_consent boolean not null default false,
  status       text not null default 'aprovado' check (status in ('aprovado', 'inativo')),
  created_at   timestamptz not null default now()
);
alter table building_staff enable row level security;
create policy "Admin CRUD staff" on building_staff for all using (is_admin());

-- ============================================================
-- RESERVATIONS (Reservas do salão)
-- ============================================================
create table reservations (
  id              uuid primary key default gen_random_uuid(),
  unit_id         uuid references units(id) on delete set null,
  unit_number     text not null,
  hall            text not null default 'Salão de Festas',
  use_date        date not null,
  resident_name   text not null,
  resident_email  text,
  fee             numeric(10,2),
  status          text not null default 'pendente' check (status in ('confirmada', 'pendente', 'cancelada')),
  notes           text,
  billing_status  text,
  exemption       boolean not null default false,
  eligible_exempt boolean not null default false,
  created_at      timestamptz not null default now()
);
alter table reservations enable row level security;
create policy "Admin CRUD reservations" on reservations for all using (is_admin());

-- ============================================================
-- MOVE REQUESTS (Mudanças)
-- ============================================================
create table move_requests (
  id            uuid primary key default gen_random_uuid(),
  unit_number   text not null,
  resident_name text not null,
  email         text,
  type          text not null default 'entrada' check (type in ('entrada', 'saida')),
  move_date     date not null,
  period        text,
  status        text not null default 'pendente' check (status in ('pendente', 'aprovada', 'cancelada')),
  notes         text,
  created_at    timestamptz not null default now()
);
alter table move_requests enable row level security;
create policy "Admin CRUD moves" on move_requests for all using (is_admin());

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_units_number on units(number);
create index idx_residents_unit on residents(unit_id);
create index idx_residents_name on residents(full_name);
create index idx_vehicles_unit on vehicles(unit_id);
create index idx_vehicles_plate on vehicles(plate);
create index idx_providers_unit on service_providers(unit_id);
create index idx_reservations_date on reservations(use_date);
create index idx_moves_date on move_requests(move_date);
