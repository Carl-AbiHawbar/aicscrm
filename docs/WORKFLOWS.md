# Workflows

Deliverables #5–#8 (§44): order, delivery, material-quotation and
handyman-quotation workflows. Statuses map to the enums in
`0001_core_schema.sql`.

## 1. Order workflow (§20 + Additional order statuses)

```mermaid
stateDiagram-v2
  [*] --> ai_draft: AI assistant
  [*] --> draft: web cart
  ai_draft --> customer_clarification_required
  customer_clarification_required --> customer_confirmation_required
  draft --> address_confirmation_required: checkout
  customer_confirmation_required --> address_confirmation_required
  address_confirmation_required --> pending_payment: address confirmed
  pending_payment --> payment_verification_required: card/bank
  pending_payment --> confirmed: COD eligible
  payment_verification_required --> confirmed: webhook verified
  confirmed --> under_review
  under_review --> awaiting_delivery_quotation: engine=quotation_required
  under_review --> preparing: engine matched
  awaiting_delivery_quotation --> preparing: logistics quoted
  preparing --> partially_prepared
  preparing --> ready_for_dispatch
  ready_for_dispatch --> vehicle_assigned
  vehicle_assigned --> out_for_delivery
  out_for_delivery --> delivered
  out_for_delivery --> partially_delivered
  out_for_delivery --> failed_delivery
  delivered --> closed
  confirmed --> cancelled
  delivered --> return_requested
  return_requested --> refund_pending --> refunded --> closed
```

**Stock reservation** happens only on: successful online payment, confirmed COD
order, approved contractor PO, or accepted quotation (§28). The AI/clarification
statuses **do not** reserve stock (Additional order statuses rule).

Every transition writes `order_status_history` (status, staff, customer note,
internal note, timestamp). Sensitive transitions run in service-role functions.

## 2. Delivery workflow (§16–§18)

```mermaid
flowchart TD
  A[Order confirmed] --> B[compute order metrics<br/>weight, volume, dims, pallets, handling]
  B --> C{match-vehicle edge fn<br/>smallest valid vehicle}
  C -->|matched| D[assign vehicle + price]
  C -->|multi_vehicle| E[propose N vehicles]
  C -->|quotation_required| F[status: awaiting_delivery_quotation]
  F --> G[logistics manager overrides<br/>vehicle / count / fee / date]
  G --> H[reason stored in audit_logs]
  D --> I[warehouse: pick/pack → ready_for_dispatch]
  E --> I
  H --> I
  I --> J[vehicle_assigned → driver]
  J --> K[out_for_delivery]
  K --> L[POD: recipient, signature, photos]
  L --> M[delivered / partially_delivered / failed_delivery]
```

## 3. Material quotation workflow (§21)

```mermaid
stateDiagram-v2
  [*] --> submitted: customer uploads BoQ/Excel/PDF or adds items
  submitted --> under_review
  under_review --> more_information_required
  under_review --> site_visit_required
  more_information_required --> under_review
  site_visit_required --> under_review
  under_review --> quotation_issued: admin builds structured lines
  quotation_issued --> revised
  revised --> quotation_issued
  quotation_issued --> accepted
  quotation_issued --> rejected
  quotation_issued --> expired
  accepted --> converted_to_order
  converted_to_order --> [*]
```

Accepted quotations convert directly into an order (reusing lines → `order_items`).

## 4. Handyman quotation / job workflow (§24–§25)

```mermaid
stateDiagram-v2
  [*] --> draft
  draft --> submitted
  submitted --> matching_professionals
  matching_professionals --> professionals_invited
  professionals_invited --> clarification_required
  professionals_invited --> site_visit_requested
  clarification_required --> quotations_received
  site_visit_requested --> quotations_received
  quotations_received --> professional_selected: customer picks (compare price/rating/warranty)
  professional_selected --> scheduled: deposit paid + appointment
  scheduled --> work_started
  work_started --> work_completed
  work_completed --> customer_confirmation_pending
  customer_confirmation_pending --> closed: reviews captured
  customer_confirmation_pending --> disputed
  disputed --> closed
  submitted --> cancelled
```

Purchased materials from the store attach to the request
(`service_request_materials`) so the professional sees which materials are
included (§26).

## 5. AI-assisted order confirmation (Additional Req 2)

```mermaid
flowchart LR
  R[request: text / voice / upload] --> T[transcribe + show for correction]
  T --> X[extract products + quantities]
  X --> M[match catalogue → confidence]
  M --> Q{clarification needed?}
  Q -->|yes| C[ask focused questions]
  Q -->|no| S[check stock + convert units server-side]
  C --> S
  S --> D[draft cart]
  D --> AD[confirm delivery address + site access]
  AD --> V[recalc vehicle + fee server-side]
  V --> F[final summary]
  F --> OK{explicit customer confirm button}
  OK -->|Confirm & pay / COD| O[create order]
  OK -->|Edit / change address / support| D
```

The order is **never** created from a voice note, transcription, upload or
initial message alone — only after a visible confirmation action (AC #13, #14).
```
