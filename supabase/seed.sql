-- ============================================================================
-- BinaaMart — sample seed data (TESTING ONLY, spec §40)
-- Clearly separated from production data. No lorem ipsum.
-- Idempotent-ish: uses ON CONFLICT on natural keys where possible.
-- ============================================================================

-- System settings (spec §41) --------------------------------------------------
insert into system_settings(key, value) values
  ('platform', '{"name":"BinaaMart","country":"SA","currency":"SAR","languages":["en","ar"]}'),
  ('delivery', '{"safety_capacity_pct":85,"free_delivery_threshold_minor":500000,"distance_default_km":15}'),
  ('cod', '{"max_amount_minor":300000,"enabled":true}'),
  ('tax', '{"default_rate_pct":15}'),
  ('quotation', '{"expiry_days":14}'),
  ('handyman', '{"commission_pct":10}')
on conflict (key) do update set value = excluded.value;

-- Categories ------------------------------------------------------------------
insert into categories(slug, name_en, name_ar, icon, sort_order) values
  ('building-materials','Building Materials','مواد البناء','brick',1),
  ('tools-equipment','Tools & Equipment','العدد والمعدات','tool',2),
  ('electrical','Electrical','الكهرباء','bolt',3),
  ('plumbing','Plumbing','السباكة','pipe',4),
  ('paint-finishing','Paint & Finishing','الدهانات والتشطيبات','paint',5),
  ('flooring-tiles','Flooring & Tiles','الأرضيات والبلاط','tiles',6),
  ('doors-panels','Doors & Panels','الأبواب والألواح','door',7),
  ('garden-outdoor','Garden & Outdoor','الحدائق والخارجية','tree',8),
  ('safety-equipment','Safety Equipment','معدات السلامة','helmet',9)
on conflict (slug) do nothing;

-- Brands ----------------------------------------------------------------------
insert into brands(slug, name_en, name_ar) values
  ('alfabuild','AlfaBuild','ألفا بيلد'),
  ('titan-tools','Titan Tools','تيتان تولز'),
  ('aquaflow','AquaFlow','أكوا فلو'),
  ('voltline','VoltLine','فولت لاين'),
  ('colora','Colora','كولورا')
on conflict (slug) do nothing;

-- Warehouse -------------------------------------------------------------------
insert into warehouses(code, name_en, name_ar, latitude, longitude) values
  ('WH-CENTRAL','Central Warehouse','المستودع المركزي',24.7136,46.6753),
  ('WH-NORTH','North Warehouse','المستودع الشمالي',24.83,46.62)
on conflict (code) do nothing;

-- Delivery zones --------------------------------------------------------------
insert into delivery_zones(name_en, name_ar, cod_eligible, postcodes) values
  ('Central City','وسط المدينة',true,'{11564,11543}'),
  ('North District','الحي الشمالي',true,'{13511}'),
  ('Industrial Zone','المنطقة الصناعية',false,'{14325}'),
  ('Southern Suburbs','الضواحي الجنوبية',true,'{16278}'),
  ('Outer Region','المنطقة الخارجية',false,'{19999}')
on conflict do nothing;

-- Vehicles (spec §16) ---------------------------------------------------------
insert into vehicles(name_en,name_ar,category,max_payload_kg,cargo_length_cm,cargo_width_cm,cargo_height_cm,cargo_volume_cm3,max_item_length_cm,max_item_width_cm,max_item_height_cm,pallet_capacity,covered,tail_lift,crane_available,forklift_compatible,base_fare_minor,per_km_minor,min_charge_minor)
values
  ('Delivery Motorcycle','دراجة نارية للتوصيل','motorcycle',30,50,40,40,80000,50,40,40,0,true,false,false,false,1500,200,1500),
  ('Delivery Car','سيارة توصيل','car',120,120,90,80,864000,130,90,80,0,true,false,false,false,2500,250,2500),
  ('Small Van','فان صغير','small_van',800,240,140,130,4368000,250,140,130,1,true,false,false,false,4000,300,5000),
  ('Large Van','فان كبير','large_van',1400,340,170,180,10404000,350,170,180,2,true,true,false,true,6000,350,7000),
  ('Pickup Truck','شاحنة بيك أب','pickup_truck',1000,240,160,50,1920000,300,160,200,1,false,false,false,true,5000,320,6000),
  ('Light Truck','شاحنة خفيفة','light_truck',3500,430,200,210,18060000,450,200,210,4,true,true,false,true,9000,450,12000),
  ('Medium Truck','شاحنة متوسطة','medium_truck',8000,620,240,240,35712000,650,240,240,8,true,true,false,true,15000,600,20000),
  ('Flatbed Truck','شاحنة مسطحة','flatbed_truck',12000,1300,250,300,97500000,1300,250,300,12,false,false,false,true,22000,800,30000),
  ('Crane Truck','شاحنة رافعة','crane_truck',15000,1300,250,300,97500000,1300,250,300,12,false,false,true,true,35000,900,45000)
on conflict do nothing;

-- Link all vehicles to all zones for the sample data
insert into vehicle_zones(vehicle_id, zone_id)
select v.id, z.id from vehicles v cross join delivery_zones z
on conflict do nothing;

-- Service categories (spec §22) ----------------------------------------------
insert into service_categories(slug,name_en,name_ar,icon) values
  ('electrician','Electrician','كهربائي','bolt'),
  ('plumber','Plumber','سباك','pipe'),
  ('painter','Painter','دهّان','paint'),
  ('tiler','Tiler','مبلّط','tiles'),
  ('carpenter','Carpenter','نجار','wood'),
  ('mason','Mason','بنّاء','brick'),
  ('general-contractor','General Contractor','مقاول عام','helmet'),
  ('aluminium-installer','Aluminium Installer','فني ألمنيوم','window'),
  ('waterproofing','Waterproofing Specialist','أخصائي عزل مائي','water'),
  ('ac-technician','AC Technician','فني تكييف','snow')
on conflict (slug) do nothing;

-- Sample products + variants (subset; app bundles the full set) ----------------
-- Cement
with c as (select id from categories where slug='building-materials'),
     b as (select id from brands where slug='alfabuild'),
     p as (
       insert into products(slug,sku,category_id,brand_id,name_en,name_ar,description_en,description_ar,unit_of_sale,base_price_minor,installable,return_eligible)
       select 'opc-cement-50kg','CEM-OPC',c.id,b.id,'Ordinary Portland Cement','أسمنت بورتلاندي عادي',
              'General-purpose OPC 42.5N cement. 50 kg bags; 60 per pallet.','أسمنت 42.5N للأغراض العامة. أكياس 50 كغ، 60 لكل منصة.',
              'bag',1800,false,false
       from c,b on conflict (slug) do nothing returning id
     )
insert into product_variants(product_id,sku,barcode,name_en,name_ar,price_minor,tax_rate_pct,unit_weight_kg,packaged_length_cm,packaged_width_cm,packaged_height_cm,palletised,pallet_length_cm,pallet_width_cm,pallet_height_cm,qty_per_pallet,forklift_required,covered_vehicle_required,max_stack_qty)
select id,'CEM-OPC-42.5','6290000000001','OPC 42.5N — 50 kg bag','أسمنت 42.5N — كيس 50 كغ',1800,15,50,60,40,15,true,120,100,120,60,true,true,12
from p;

-- Porcelain tile (coverage-based, fragile)
with c as (select id from categories where slug='flooring-tiles'),
     b as (select id from brands where slug='alfabuild'),
     p as (
       insert into products(slug,sku,category_id,brand_id,name_en,name_ar,description_en,description_ar,unit_of_sale,coverage_per_unit,coverage_unit,base_price_minor,installable,return_eligible)
       select 'porcelain-floor-tile','TIL-POR',c.id,b.id,'Porcelain Floor Tile','بلاط بورسلان أرضي',
              'Rectified porcelain 60x60. One box covers 1.44 m².','بورسلان مشطوف 60×60. الصندوق يغطي 1.44 م².',
              'box',1.44,'square_metre',6500,true,true
       from c,b on conflict (slug) do nothing returning id
     )
insert into product_variants(product_id,sku,barcode,name_en,name_ar,price_minor,tax_rate_pct,unit_weight_kg,packaged_length_cm,packaged_width_cm,packaged_height_cm,fragile,upright_only,palletised,qty_per_pallet,forklift_required,covered_vehicle_required,max_stack_qty)
select id, x.sku, x.barcode, x.en, x.ar, x.price, 15, 24, 62, 62, 12, true, true, true, 40, true, true, 8
from p, (values
  ('TIL-POR-GRY','6290000000010','Grey matte 60×60','رمادي مطفي 60×60',6500),
  ('TIL-POR-BEI','6290000000011','Beige polished 60×60','بيج ملمّع 60×60',7200)
) as x(sku,barcode,en,ar,price);

-- Steel rebar (oversized, crane required)
with c as (select id from categories where slug='building-materials'),
     b as (select id from brands where slug='alfabuild'),
     p as (
       insert into products(slug,sku,category_id,brand_id,name_en,name_ar,description_en,description_ar,unit_of_sale,base_price_minor)
       select 'steel-rebar','STL-RBR',c.id,b.id,'Steel Reinforcement Bar','حديد تسليح',
              'Deformed rebar grade 60, 12 m lengths.','حديد تسليح مضلع درجة 60، أطوال 12 م.','piece',5200
       from c,b on conflict (slug) do nothing returning id
     )
insert into product_variants(product_id,sku,barcode,name_en,name_ar,price_minor,tax_rate_pct,unit_weight_kg,packaged_length_cm,packaged_width_cm,packaged_height_cm,oversized,crane_required,max_stack_qty)
select id, x.sku, x.barcode, x.en, x.ar, x.price, 15, x.w, 1200, x.d, x.d, true, true, 40
from p, (values
  ('STL-RBR-12','6290000000020','Ø12 mm — 12 m','قطر 12 مم — 12 م',5200,10.7,5),
  ('STL-RBR-16','6290000000021','Ø16 mm — 12 m','قطر 16 مم — 12 م',9100,18.9,6)
) as x(sku,barcode,en,ar,price,w,d);

-- Inventory for all seeded variants at the central warehouse
insert into inventory(variant_id, warehouse_id, on_hand, low_stock_threshold)
select v.id, (select id from warehouses where code='WH-CENTRAL'), 1000, 50
from product_variants v
on conflict (variant_id, warehouse_id) do nothing;

-- Product images (sample) -----------------------------------------------------
insert into product_images(product_id, url, alt_en, alt_ar, sort_order)
select p.id, x.url, x.alt_en, x.alt_ar, 0
from products p, (values
  ('opc-cement-50kg','/images/prod-cement.jpg','Portland cement bag','كيس أسمنت بورتلاندي'),
  ('porcelain-floor-tile','/images/prod-tile.jpg','Porcelain floor tiles','بلاط بورسلان أرضي'),
  ('steel-rebar','/images/prod-rebar.jpg','Steel reinforcement bars','حديد تسليح')
) as x(slug,url,alt_en,alt_ar)
where p.slug = x.slug;

-- Professional profiles (sample) ----------------------------------------------
with e as (select id from service_categories where slug='electrician'),
     pr as (
       insert into professional_profiles(name_en,name_ar,business_name,years_experience,languages,starting_price_minor,site_visit_fee_minor,emergency_service,verified,rating,review_count,completed_jobs)
       values ('Khaled Mansour','خالد منصور','BrightVolt Electrical',12,'{ar,en}',8000,5000,true,true,4.8,156,320)
       returning id
     )
insert into professional_services(professional_id, service_category_id)
select pr.id, e.id from pr, e;

-- Product synonyms (spec AI admin) --------------------------------------------
insert into product_synonyms(product_id, term, locale)
select p.id, x.term, x.locale
from products p, (values
  ('steel-rebar','rebar','en'),('steel-rebar','reinforcement bar','en'),
  ('steel-rebar','حديد تسليح','ar'),('steel-rebar','قضيب حديد','ar'),
  ('opc-cement-50kg','cement','en'),('opc-cement-50kg','أسمنت','ar')
) as x(slug,term,locale)
where p.slug = x.slug;
