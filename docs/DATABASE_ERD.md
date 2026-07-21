# Database — Entity Relationship Structure

Deliverable #2 (§44). Full DDL: `supabase/migrations/0001_core_schema.sql`.
~90 tables grouped by domain. Below is the relationship overview; every table
has `created_at`/`updated_at` and (where relevant) `deleted_at` for soft delete.

## Core commerce relationships

```mermaid
erDiagram
  categories ||--o{ products : has
  brands ||--o{ products : has
  products ||--o{ product_variants : has
  product_variants ||--o{ inventory : stocked_in
  warehouses ||--o{ inventory : holds
  products ||--o{ product_images : has
  products ||--o{ product_documents : has
  products ||--o{ product_relationships : relates
  product_variants ||--o{ product_variant_values : configured_by
  product_attribute_values ||--o{ product_variant_values : used_in
  product_attributes ||--o{ product_attribute_values : has

  profiles ||--o{ orders : places
  companies ||--o{ orders : billed_to
  orders ||--o{ order_items : contains
  product_variants ||--o{ order_items : ordered
  orders ||--o{ order_status_history : logs
  orders ||--o{ payments : paid_by
  payments ||--o{ payment_transactions : settled_by
  orders ||--o{ deliveries : fulfilled_by
```

## Identity, addresses & construction sites

```mermaid
erDiagram
  auth_users ||--|| profiles : extends
  profiles ||--o{ user_roles : granted
  profiles ||--o{ companies : owns
  companies ||--o{ company_users : employs
  profiles ||--o{ addresses : saves
  profiles ||--o{ construction_sites : manages
  construction_sites ||--o{ construction_site_contacts : has
  addresses ||--o{ address_versions : snapshotted
  orders ||--o{ order_address_confirmations : confirmed_by
  orders ||--o{ order_address_change_requests : may_change
```

## Logistics

```mermaid
erDiagram
  delivery_zones ||--o{ vehicle_zones : served_by
  vehicles ||--o{ vehicle_zones : serves
  vehicles ||--o{ drivers : driven_by
  orders ||--o{ deliveries : has
  deliveries ||--o{ delivery_assignments : assigned
  deliveries ||--o{ delivery_status_history : logs
```

## Quotations, projects & calculators

```mermaid
erDiagram
  profiles ||--o{ projects : owns
  projects ||--o{ project_items : lists
  projects ||--o{ material_calculations : saves
  material_quote_requests ||--o{ material_quote_request_files : attaches
  material_quote_requests ||--o{ material_quotations : answered_by
  material_quotations ||--o{ material_quotation_items : lines
```

## Handyman marketplace

```mermaid
erDiagram
  service_categories ||--o{ professional_services : categorises
  professional_profiles ||--o{ professional_services : offers
  professional_profiles ||--o{ professional_service_areas : covers
  professional_profiles ||--o{ professional_documents : verified_by
  professional_profiles ||--o{ professional_portfolio : showcases
  service_requests ||--o{ service_request_files : attaches
  service_requests ||--o{ service_request_materials : includes
  service_requests ||--o{ service_quotations : receives
  service_quotations ||--o{ service_quotation_items : lines
  service_requests ||--o{ appointments : schedules
```

## AI ordering assistant

```mermaid
erDiagram
  ai_conversations ||--o{ ai_conversation_messages : transcript
  ai_conversations ||--o{ ai_voice_notes : uploads
  ai_voice_notes ||--o{ ai_transcriptions : transcribed
  ai_conversations ||--o{ ai_extracted_requests : parses
  ai_extracted_requests ||--o{ ai_product_matches : matched
  ai_conversations ||--o{ ai_clarification_questions : asks
  ai_conversations ||--o{ ai_draft_carts : builds
  ai_draft_carts ||--o{ ai_draft_cart_items : contains
  ai_conversations ||--o{ ai_customer_confirmations : confirmed_by
  ai_conversations ||--o{ ai_escalations : escalates
  ai_conversations ||--o| orders : creates
```

## Cross-cutting

`reviews`, `disputes`, `claims` (+ `claim_files`), `notifications`,
`promotions`, `translation_status`, `audit_logs`, `system_settings`,
`product_synonyms`.

## Money & measurement conventions

- **Money**: integer minor units (`*_minor bigint`) to avoid float rounding.
- **Weight**: kilograms (`numeric`). **Dimensions**: centimetres. **Volume**:
  cm³ (derived) — consistent with the vehicle-matching engine.
```
