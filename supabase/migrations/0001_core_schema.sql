-- ============================================================================
-- BinaaMart — Core schema (Stage 1 foundation)
-- Bilingual construction materials, delivery & handyman platform.
--
-- Conventions:
--   * UUID primary keys (gen_random_uuid()).
--   * Bilingual content uses paired *_en / *_ar columns (spec §4).
--   * Money stored as integer minor units (e.g. halalas) to avoid float error.
--   * created_at / updated_at on every table; deleted_at for soft deletion.
--   * All operational data lives here — nothing hard-coded in the frontend.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm"; -- fuzzy / typo-tolerant search (spec §11)

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type app_role as enum (
  'guest','customer','contractor','handyman','driver','warehouse','admin'
);

create type unit_of_sale as enum (
  'piece','pack','box','bag','roll','metre','square_metre','cubic_metre',
  'kilogram','tonne','pallet','sheet','panel','set'
);

create type stock_status as enum ('in_stock','low_stock','out_of_stock','backorder');

create type vehicle_category as enum (
  'motorcycle','car','small_van','large_van','pickup_truck','light_truck',
  'medium_truck','heavy_truck','lorry','crane_truck','flatbed_truck'
);

create type order_status as enum (
  'ai_draft','draft','pending_payment','payment_verification_required',
  'customer_clarification_required','customer_confirmation_required',
  'address_confirmation_required','address_change_under_review','human_review_required',
  'confirmed','under_review','awaiting_delivery_quotation','preparing',
  'partially_prepared','ready_for_dispatch','vehicle_assigned','out_for_delivery',
  'partially_delivered','delivered','failed_delivery','cancelled',
  'return_requested','refund_pending','refunded','closed'
);

create type payment_method as enum (
  'card','cod','bank_transfer','payment_link','account_credit','partial_deposit'
);

create type payment_status as enum ('pending','authorized','paid','failed','refunded','partial');

create type address_type as enum (
  'home','office','warehouse','construction_site','renovation_site','customer_site','other'
);

create type quote_status as enum (
  'submitted','under_review','more_information_required','site_visit_required',
  'quotation_issued','revised','accepted','rejected','expired','converted_to_order'
);

create type service_request_status as enum (
  'draft','submitted','matching_professionals','professionals_invited','clarification_required',
  'site_visit_requested','quotations_received','professional_selected','scheduled',
  'work_started','work_completed','customer_confirmation_pending','disputed','cancelled','closed'
);

create type ai_match_confidence as enum ('confirmed','likely','clarification_required','no_match');

-- ---------------------------------------------------------------------------
-- Identity, roles, companies
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  full_name_ar text,
  phone text,
  preferred_locale text not null default 'en' check (preferred_locale in ('en','ar')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table user_roles (
  user_id uuid not null references profiles(id) on delete cascade,
  role app_role not null,
  granted_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_ar text,
  tax_number text,
  credit_approved boolean not null default false,
  credit_limit_minor bigint not null default 0,
  discount_tier text,
  owner_id uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table company_users (
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'employee',
  can_place_orders boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Addresses + construction sites + address versioning (Additional Req 1)
-- ---------------------------------------------------------------------------
create table addresses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  company_id uuid references companies(id) on delete set null,
  label text,
  type address_type not null default 'home',
  line1 text not null,
  line2 text,
  city text,
  region text,
  postcode text,
  country text not null default 'SA',
  latitude double precision,
  longitude double precision,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table construction_sites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  company_id uuid references companies(id) on delete set null,
  address_id uuid references addresses(id) on delete set null,
  site_name text not null,
  project_id uuid,
  contractor_name text,
  handyman_name text,
  temporary boolean not null default true,
  expected_end_date date,
  latitude double precision,
  longitude double precision,
  access_notes text,
  road_restrictions text,
  max_vehicle_size vehicle_category,
  crane_access boolean not null default false,
  forklift_available boolean not null default false,
  loading_zone boolean not null default false,
  working_hours text,
  security_gate_instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table construction_site_contacts (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references construction_sites(id) on delete cascade,
  name text not null,
  phone text not null,
  role text,
  created_at timestamptz not null default now()
);

-- Immutable snapshot of an address at a point in time (never mutated).
create table address_versions (
  id uuid primary key default gen_random_uuid(),
  address_id uuid references addresses(id) on delete set null,
  site_id uuid references construction_sites(id) on delete set null,
  snapshot jsonb not null,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references categories(id) on delete set null,
  slug text not null unique,
  name_en text not null,
  name_ar text not null,
  seo_title_en text, seo_title_ar text,
  seo_description_en text, seo_description_ar text,
  icon text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table brands (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_ar text not null,
  logo_url text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  sku text not null unique,
  category_id uuid not null references categories(id),
  brand_id uuid references brands(id),
  name_en text not null,
  name_ar text not null,
  description_en text,
  description_ar text,
  seo_title_en text, seo_title_ar text,
  seo_description_en text, seo_description_ar text,
  product_type text,
  unit_of_sale unit_of_sale not null default 'piece',
  coverage_per_unit numeric,
  coverage_unit unit_of_sale,
  base_price_minor bigint not null default 0,
  tax_rate_pct numeric not null default 15,
  min_order_qty numeric not null default 1,
  qty_increment numeric not null default 1,
  lead_time_days int,
  warranty text,
  return_eligible boolean not null default true,
  country_of_origin text,
  installable boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table product_attributes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_en text not null,
  name_ar text not null,
  created_at timestamptz not null default now()
);

create table product_attribute_values (
  id uuid primary key default gen_random_uuid(),
  attribute_id uuid not null references product_attributes(id) on delete cascade,
  value_en text not null,
  value_ar text not null,
  created_at timestamptz not null default now()
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  sku text not null unique,
  barcode text,
  name_en text not null,
  name_ar text not null,
  price_minor bigint not null,
  promo_price_minor bigint,
  cost_minor bigint,
  tax_rate_pct numeric not null default 15,
  stock_status stock_status not null default 'in_stock',
  min_qty numeric not null default 1,
  max_qty numeric,
  qty_increment numeric not null default 1,
  image_url text,
  -- Handling profile (spec §16) — required by the vehicle-matching engine
  unit_weight_kg numeric not null default 0,
  packaged_length_cm numeric not null default 0,
  packaged_width_cm numeric not null default 0,
  packaged_height_cm numeric not null default 0,
  stackable boolean not null default true,
  max_stack_qty int,
  fragile boolean not null default false,
  upright_only boolean not null default false,
  oversized boolean not null default false,
  hazardous boolean not null default false,
  palletised boolean not null default false,
  pallet_length_cm numeric,
  pallet_width_cm numeric,
  pallet_height_cm numeric,
  qty_per_pallet int,
  crane_required boolean not null default false,
  forklift_required boolean not null default false,
  covered_vehicle_required boolean not null default false,
  open_truck_allowed boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table product_variant_values (
  variant_id uuid not null references product_variants(id) on delete cascade,
  attribute_value_id uuid not null references product_attribute_values(id) on delete cascade,
  primary key (variant_id, attribute_value_id)
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete cascade,
  url text not null,
  alt_en text, alt_ar text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table product_documents (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  kind text not null, -- 'technical','safety','installation'
  title_en text, title_ar text,
  url text not null,
  created_at timestamptz not null default now()
);

create table product_relationships (
  product_id uuid not null references products(id) on delete cascade,
  related_product_id uuid not null references products(id) on delete cascade,
  kind text not null, -- 'related','compatible','alternative','bundle'
  primary key (product_id, related_product_id, kind)
);

create table product_synonyms (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  term text not null,
  locale text not null default 'en',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Warehouses, inventory, pricing
-- ---------------------------------------------------------------------------
create table warehouses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_en text not null,
  name_ar text not null,
  latitude double precision,
  longitude double precision,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table inventory (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references product_variants(id) on delete cascade,
  warehouse_id uuid not null references warehouses(id) on delete cascade,
  on_hand numeric not null default 0,
  reserved numeric not null default 0,
  incoming numeric not null default 0,
  damaged numeric not null default 0,
  low_stock_threshold numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique (variant_id, warehouse_id)
);

create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references product_variants(id),
  warehouse_id uuid not null references warehouses(id),
  delta numeric not null,
  reason text not null,
  reference_id uuid,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table pricing_tiers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  min_qty numeric not null default 1,
  discount_pct numeric not null default 0,
  created_at timestamptz not null default now()
);

create table customer_prices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  variant_id uuid not null references product_variants(id) on delete cascade,
  price_minor bigint not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Cart & orders
-- ---------------------------------------------------------------------------
create table carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  session_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  variant_id uuid not null references product_variants(id),
  quantity numeric not null,
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references profiles(id),
  company_id uuid references companies(id),
  status order_status not null default 'draft',
  currency text not null default 'SAR',
  subtotal_minor bigint not null default 0,
  tax_minor bigint not null default 0,
  discount_minor bigint not null default 0,
  delivery_minor bigint not null default 0,
  total_minor bigint not null default 0,
  payment_method payment_method,
  payment_status payment_status not null default 'pending',
  po_number text,
  -- Immutable confirmed delivery-address snapshot (Additional Req 1)
  delivery_address_snapshot jsonb,
  delivery_latitude double precision,
  delivery_longitude double precision,
  -- Logistics engine output
  vehicle_match jsonb,
  requires_manual_logistics boolean not null default false,
  created_via text not null default 'web', -- 'web','ai','admin','quotation'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  variant_id uuid not null references product_variants(id),
  name_en text not null,
  name_ar text not null,
  sku text not null,
  unit_of_sale unit_of_sale not null,
  quantity numeric not null,
  unit_price_minor bigint not null,
  tax_rate_pct numeric not null default 15,
  line_total_minor bigint not null,
  created_at timestamptz not null default now()
);

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status order_status not null,
  staff_id uuid references profiles(id),
  customer_note text,
  internal_note text,
  created_at timestamptz not null default now()
);

create table order_address_confirmations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  address_version_id uuid references address_versions(id),
  confirmed_by uuid references profiles(id),
  confirmation_method text not null, -- 'manual','current_location','ai'
  latitude double precision,
  longitude double precision,
  confirmed_at timestamptz not null default now()
);

create table order_address_change_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  previous_snapshot jsonb,
  requested_snapshot jsonb not null,
  reason text,
  requested_by uuid references profiles(id),
  approved_by uuid references profiles(id),
  delivery_cost_adjustment_minor bigint,
  status text not null default 'pending', -- 'pending','approved','rejected'
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Payments
-- ---------------------------------------------------------------------------
create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  method payment_method not null,
  status payment_status not null default 'pending',
  amount_minor bigint not null,
  created_at timestamptz not null default now()
);

create table payment_transactions (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id) on delete cascade,
  provider text not null,
  provider_ref text,
  raw_event jsonb,
  status payment_status not null,
  created_at timestamptz not null default now()
);

create table refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  amount_minor bigint not null,
  reason text,
  status text not null default 'pending',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Logistics: zones, vehicles, drivers, deliveries
-- ---------------------------------------------------------------------------
create table delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ar text not null,
  cod_eligible boolean not null default true,
  postcodes text[] not null default '{}',
  polygon jsonb,
  created_at timestamptz not null default now()
);

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ar text not null,
  category vehicle_category not null,
  max_payload_kg numeric not null,
  cargo_length_cm numeric not null,
  cargo_width_cm numeric not null,
  cargo_height_cm numeric not null,
  cargo_volume_cm3 numeric not null,
  max_item_length_cm numeric not null,
  max_item_width_cm numeric not null,
  max_item_height_cm numeric not null,
  pallet_capacity int not null default 0,
  covered boolean not null default false,
  tail_lift boolean not null default false,
  crane_available boolean not null default false,
  forklift_compatible boolean not null default false,
  base_fare_minor bigint not null default 0,
  per_km_minor bigint not null default 0,
  min_charge_minor bigint not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table vehicle_zones (
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  zone_id uuid not null references delivery_zones(id) on delete cascade,
  primary key (vehicle_id, zone_id)
);

create table drivers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  name text not null,
  phone text not null,
  vehicle_id uuid references vehicles(id),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  vehicle_id uuid references vehicles(id),
  driver_id uuid references drivers(id),
  status text not null default 'pending',
  scheduled_date date,
  proof_of_delivery_url text,
  recipient_name text,
  signature_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table delivery_assignments (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references deliveries(id) on delete cascade,
  vehicle_id uuid references vehicles(id),
  driver_id uuid references drivers(id),
  assigned_by uuid references profiles(id),
  override_reason text,
  created_at timestamptz not null default now()
);

create table delivery_status_history (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references deliveries(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Calculators & projects
-- ---------------------------------------------------------------------------
create table projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  company_id uuid references companies(id),
  name text not null,
  description text,
  address_id uuid references addresses(id),
  project_type text,
  budget_minor bigint,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table project_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  variant_id uuid references product_variants(id),
  quantity numeric,
  purchased boolean not null default false,
  created_at timestamptz not null default now()
);

create table material_calculations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  calculator_id text not null,
  inputs jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Material quotations
-- ---------------------------------------------------------------------------
create table material_quote_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text not null unique,
  user_id uuid references profiles(id),
  company_id uuid references companies(id),
  project_id uuid references projects(id),
  status quote_status not null default 'submitted',
  location text,
  deadline date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table material_quote_request_files (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references material_quote_requests(id) on delete cascade,
  url text not null,
  kind text, -- 'excel','pdf','image','drawing','boq'
  created_at timestamptz not null default now()
);

create table material_quotations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references material_quote_requests(id) on delete cascade,
  quotation_number text not null unique,
  issue_date date not null default current_date,
  expiry_date date,
  payment_terms text,
  delivery_terms text,
  total_minor bigint not null default 0,
  deposit_minor bigint,
  locale text not null default 'en',
  status quote_status not null default 'quotation_issued',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table material_quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references material_quotations(id) on delete cascade,
  variant_id uuid references product_variants(id),
  description text,
  quantity numeric not null,
  unit unit_of_sale,
  unit_price_minor bigint not null,
  discount_pct numeric not null default 0,
  tax_rate_pct numeric not null default 15,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Handyman marketplace
-- ---------------------------------------------------------------------------
create table service_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_ar text not null,
  icon text,
  created_at timestamptz not null default now()
);

create table professional_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name_en text not null,
  name_ar text,
  business_name text,
  description_en text, description_ar text,
  years_experience int,
  languages text[] not null default '{}',
  site_visit_fee_minor bigint,
  starting_price_minor bigint,
  emergency_service boolean not null default false,
  verified boolean not null default false, -- admin-only (spec §23)
  active boolean not null default true,
  rating numeric not null default 0,
  review_count int not null default 0,
  completed_jobs int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table professional_services (
  professional_id uuid not null references professional_profiles(id) on delete cascade,
  service_category_id uuid not null references service_categories(id) on delete cascade,
  primary key (professional_id, service_category_id)
);

create table professional_service_areas (
  professional_id uuid not null references professional_profiles(id) on delete cascade,
  zone_id uuid not null references delivery_zones(id) on delete cascade,
  primary key (professional_id, zone_id)
);

create table professional_documents (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professional_profiles(id) on delete cascade,
  kind text not null, -- 'id','certification','insurance'
  url text not null,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table professional_portfolio (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professional_profiles(id) on delete cascade,
  url text not null,
  caption text,
  created_at timestamptz not null default now()
);

create table service_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text not null unique,
  user_id uuid references profiles(id),
  service_category_id uuid references service_categories(id),
  project_id uuid references projects(id),
  status service_request_status not null default 'draft',
  title text,
  description text,
  property_type text,
  site_id uuid references construction_sites(id),
  latitude double precision,
  longitude double precision,
  preferred_date date,
  urgency text,
  budget_min_minor bigint,
  budget_max_minor bigint,
  materials_included boolean,
  site_visit_required boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table service_request_files (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references service_requests(id) on delete cascade,
  url text not null,
  kind text,
  created_at timestamptz not null default now()
);

-- purchased materials attached to a service request (spec §26)
create table service_request_materials (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references service_requests(id) on delete cascade,
  order_item_id uuid references order_items(id),
  variant_id uuid references product_variants(id),
  quantity numeric,
  created_at timestamptz not null default now()
);

create table service_quotations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references service_requests(id) on delete cascade,
  professional_id uuid not null references professional_profiles(id) on delete cascade,
  labour_minor bigint not null default 0,
  material_minor bigint not null default 0,
  site_visit_minor bigint not null default 0,
  transport_minor bigint not null default 0,
  estimated_duration text,
  start_date date,
  completion_date date,
  warranty text,
  exclusions text,
  payment_schedule text,
  notes text,
  valid_until date,
  status text not null default 'submitted',
  created_at timestamptz not null default now()
);

create table service_quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references service_quotations(id) on delete cascade,
  description text not null,
  amount_minor bigint not null,
  created_at timestamptz not null default now()
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  service_request_id uuid references service_requests(id) on delete cascade,
  professional_id uuid references professional_profiles(id),
  scheduled_at timestamptz not null,
  kind text not null default 'site_visit', -- 'site_visit','work'
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);

create table job_status_history (
  id uuid primary key default gen_random_uuid(),
  service_request_id uuid not null references service_requests(id) on delete cascade,
  status service_request_status not null,
  note text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Reviews, disputes, claims
-- ---------------------------------------------------------------------------
create table reviews (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id),
  product_id uuid references products(id) on delete cascade,
  professional_id uuid references professional_profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  quality int, punctuality int, communication int, cleanliness int, value int, accuracy int,
  comment text,
  created_at timestamptz not null default now()
);

create table disputes (
  id uuid primary key default gen_random_uuid(),
  service_request_id uuid references service_requests(id) on delete cascade,
  raised_by uuid references profiles(id),
  category text not null,
  description text,
  resolution_note text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table claims (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  order_item_id uuid references order_items(id),
  quantity_affected numeric,
  category text not null,
  description text,
  preferred_resolution text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table claim_files (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references claims(id) on delete cascade,
  url text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Notifications, promotions, translations, audit, settings
-- ---------------------------------------------------------------------------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  template text not null,
  title_en text, title_ar text,
  body_en text, body_ar text,
  channel text not null default 'in_app', -- 'in_app','email','sms','whatsapp'
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table promotions (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name_en text, name_ar text,
  discount_pct numeric,
  discount_minor bigint,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table translation_status (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null, -- 'product','category','content'
  entity_id uuid not null,
  en_complete boolean not null default false,
  ar_complete boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (entity_type, entity_id)
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  before jsonb,
  after jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create table system_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- AI ordering assistant (Additional Req 2)
-- ---------------------------------------------------------------------------
create table ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  session_token text,
  locale text not null default 'en',
  status text not null default 'active',
  human_agent_id uuid references profiles(id),
  created_order_id uuid references orders(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ai_conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  role text not null, -- 'user','assistant','agent','system'
  content text,
  created_at timestamptz not null default now()
);

create table ai_voice_notes (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  audio_url text not null,
  status text not null default 'uploaded',
  created_at timestamptz not null default now()
);

create table ai_transcriptions (
  id uuid primary key default gen_random_uuid(),
  voice_note_id uuid not null references ai_voice_notes(id) on delete cascade,
  detected_language text,
  text text,
  corrected_text text,
  created_at timestamptz not null default now()
);

create table ai_extracted_requests (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  raw text not null,
  quantity numeric,
  unit_hint text,
  keywords text[],
  created_at timestamptz not null default now()
);

create table ai_product_matches (
  id uuid primary key default gen_random_uuid(),
  extracted_request_id uuid not null references ai_extracted_requests(id) on delete cascade,
  product_id uuid references products(id),
  variant_id uuid references product_variants(id),
  confidence ai_match_confidence not null,
  corrected_variant_id uuid references product_variants(id),
  created_at timestamptz not null default now()
);

create table ai_clarification_questions (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  question_en text, question_ar text,
  answered boolean not null default false,
  answer text,
  created_at timestamptz not null default now()
);

create table ai_draft_carts (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  version int not null default 1,
  confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

create table ai_draft_cart_items (
  id uuid primary key default gen_random_uuid(),
  draft_cart_id uuid not null references ai_draft_carts(id) on delete cascade,
  variant_id uuid references product_variants(id),
  quantity numeric not null,
  confidence ai_match_confidence not null default 'likely',
  created_at timestamptz not null default now()
);

create table ai_customer_confirmations (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  draft_cart_id uuid references ai_draft_carts(id),
  address_confirmed boolean not null default false,
  order_confirmed boolean not null default false,
  confirmed_at timestamptz not null default now()
);

create table ai_escalations (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  reason text not null,
  resolved boolean not null default false,
  agent_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes (spec §37 performance)
-- ---------------------------------------------------------------------------
create index idx_products_category on products(category_id) where deleted_at is null;
create index idx_products_brand on products(brand_id);
create index idx_products_name_trgm on products using gin (name_en gin_trgm_ops, name_ar gin_trgm_ops);
create index idx_variants_product on product_variants(product_id);
create index idx_variants_sku on product_variants(sku);
create index idx_variants_barcode on product_variants(barcode);
create index idx_inventory_variant on inventory(variant_id);
create index idx_orders_user on orders(user_id);
create index idx_orders_status on orders(status);
create index idx_order_items_order on order_items(order_id);
create index idx_addresses_owner on addresses(owner_id);
create index idx_sites_owner on construction_sites(owner_id);
create index idx_ai_msgs_conversation on ai_conversation_messages(conversation_id);
create index idx_synonyms_term_trgm on product_synonyms using gin (term gin_trgm_ops);
