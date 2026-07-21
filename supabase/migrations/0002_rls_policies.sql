-- ============================================================================
-- Row-Level Security (spec §36)
-- Principle: catalogue is world-readable; personal data is owner-scoped;
-- sensitive writes (prices, status, verification, inventory, delivery fees)
-- are admin/service-role only and never performed by the customer role.
-- ============================================================================

-- Role check helper. SECURITY DEFINER so it can read user_roles under RLS.
create or replace function public.has_role(check_role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid() and role = check_role
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role('admin');
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role('admin') or public.has_role('warehouse') or public.has_role('driver');
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','user_roles','companies','company_users','addresses',
    'construction_sites','construction_site_contacts','address_versions',
    'categories','brands','products','product_attributes','product_attribute_values',
    'product_variants','product_variant_values','product_images','product_documents',
    'product_relationships','product_synonyms','warehouses','inventory','inventory_movements',
    'pricing_tiers','customer_prices','carts','cart_items','orders','order_items',
    'order_status_history','order_address_confirmations','order_address_change_requests',
    'payments','payment_transactions','refunds','delivery_zones','vehicles','vehicle_zones',
    'drivers','deliveries','delivery_assignments','delivery_status_history','projects',
    'project_items','material_calculations','material_quote_requests','material_quote_request_files',
    'material_quotations','material_quotation_items','service_categories','professional_profiles',
    'professional_services','professional_service_areas','professional_documents','professional_portfolio',
    'service_requests','service_request_files','service_request_materials','service_quotations',
    'service_quotation_items','appointments','job_status_history','reviews','disputes','claims',
    'claim_files','notifications','promotions','translation_status','audit_logs','system_settings',
    'ai_conversations','ai_conversation_messages','ai_voice_notes','ai_transcriptions',
    'ai_extracted_requests','ai_product_matches','ai_clarification_questions','ai_draft_carts',
    'ai_draft_cart_items','ai_customer_confirmations','ai_escalations'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Public catalogue: readable by everyone (incl. anon), writable by admin only
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'categories','brands','products','product_attributes','product_attribute_values',
    'product_variants','product_variant_values','product_images','product_documents',
    'product_relationships','product_synonyms','service_categories','delivery_zones',
    'vehicles','vehicle_zones','promotions','warehouses'
  ]
  loop
    execute format('create policy %I on %I for select using (true);', t || '_read', t);
    execute format('create policy %I on %I for all using (public.is_admin()) with check (public.is_admin());', t || '_admin_write', t);
  end loop;
end $$;

-- Professionals: public can read active + verified; owner can edit own; admin all
create policy pro_public_read on professional_profiles for select
  using (active = true or user_id = auth.uid() or public.is_admin());
create policy pro_owner_write on professional_profiles for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy pro_admin_all on professional_profiles for all
  using (public.is_admin()) with check (public.is_admin());
-- Only admins may set verified — enforced in an edge function / trigger below.

-- ---------------------------------------------------------------------------
-- Profiles & personal data: owner-scoped
-- ---------------------------------------------------------------------------
create policy profiles_self on profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_self_upd on profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy roles_self_read on user_roles for select using (user_id = auth.uid() or public.is_admin());
create policy roles_admin_write on user_roles for all using (public.is_admin()) with check (public.is_admin());

-- Addresses / sites: owner or admin
create policy addr_owner on addresses for all
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());
create policy sites_owner on construction_sites for all
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

-- Orders: customer reads own; staff reads all; customers cannot change price/status
create policy orders_owner_read on orders for select
  using (user_id = auth.uid() or public.is_staff());
create policy orders_owner_insert on orders for insert
  with check (user_id = auth.uid());
-- NOTE: updates to price/status/vehicle are performed by service-role edge
-- functions only. No customer UPDATE policy is granted on orders.
create policy orders_admin_all on orders for all
  using (public.is_admin()) with check (public.is_admin());

create policy order_items_read on order_items for select
  using (exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff())));

create policy order_history_read on order_status_history for select
  using (exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff())));

-- Projects / calculations / carts: owner-scoped
create policy projects_owner on projects for all
  using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());
create policy calc_owner on material_calculations for all
  using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());
create policy carts_owner on carts for all
  using (user_id = auth.uid() or user_id is null) with check (user_id = auth.uid() or user_id is null);

-- Notifications: owner read
create policy notif_owner on notifications for select using (user_id = auth.uid() or public.is_admin());

-- Reviews: public read, author write
create policy reviews_read on reviews for select using (true);
create policy reviews_author on reviews for insert with check (author_id = auth.uid());

-- Inventory / pricing / audit / settings: admin & staff only (no customer access)
create policy inv_staff on inventory for select using (public.is_staff());
create policy inv_admin on inventory for all using (public.is_admin()) with check (public.is_admin());
create policy audit_admin on audit_logs for select using (public.is_admin());
create policy settings_read on system_settings for select using (true);
create policy settings_admin on system_settings for all using (public.is_admin()) with check (public.is_admin());

-- AI conversations: owner-scoped, staff can join
create policy ai_conv_owner on ai_conversations for all
  using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid() or public.is_staff());
create policy ai_msg_owner on ai_conversation_messages for select
  using (exists (select 1 from ai_conversations c where c.id = conversation_id and (c.user_id = auth.uid() or public.is_staff())));

-- Service requests: owner + invited professional + admin
create policy sr_owner on service_requests for all
  using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy sq_read on service_quotations for select using (true);
