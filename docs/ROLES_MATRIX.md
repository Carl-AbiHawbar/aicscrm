# User-Role Permissions Matrix

Deliverable #3 (§44). Enforced by Supabase RLS (`0002_rls_policies.sql`) via
`has_role()`, `is_admin()`, `is_staff()`. Roles live in `user_roles` (a user may
hold several). `app_role` enum: `guest, customer, contractor, handyman, driver,
warehouse, admin`.

Legend: ✅ full · 👁 read-only · ⛔ none · 🔒 own records only

| Capability | Guest | Customer | Contractor | Handyman | Driver | Warehouse | Admin |
|---|---|---|---|---|---|---|---|
| Browse / search catalogue | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Use calculators | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add to cart / start checkout | ✅ | ✅ | ✅ | – | – | – | ✅ |
| Place order / pay / COD | ⛔ | ✅ | ✅ | – | – | – | ✅ |
| Manage profile / addresses | ⛔ | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | ✅ |
| Save projects / calcs | ⛔ | 🔒 | 🔒 | – | – | – | ✅ |
| Construction sites | ⛔ | 🔒 | 🔒 | – | – | – | ✅ |
| Upload BoQ / material quote | ⛔ | ✅ | ✅ | – | – | – | ✅ |
| Reorder / templates | ⛔ | ✅ | ✅ | – | – | – | ✅ |
| Claims / reviews | ⛔ | 🔒 | 🔒 | – | – | – | ✅ |
| Company account / tax / employees | ⛔ | ⛔ | 🔒 | – | – | – | ✅ |
| Contractor pricing / volume discounts | ⛔ | ⛔ | ✅ | – | – | – | ✅ |
| Purchase orders / credit terms | ⛔ | ⛔ | 🔒* | – | – | – | ✅ |
| Manage professional profile | ⛔ | ⛔ | ⛔ | 🔒 | – | – | ✅ |
| Submit / edit service quotations | ⛔ | ⛔ | ⛔ | 🔒 | – | – | ✅ |
| Accept jobs / update job status | ⛔ | ⛔ | ⛔ | 🔒 | – | – | ✅ |
| View assigned deliveries | ⛔ | ⛔ | ⛔ | – | 🔒 | – | ✅ |
| Update delivery status / POD | ⛔ | ⛔ | ⛔ | – | 🔒 | – | ✅ |
| Pick/pack, scan, report shortages | ⛔ | ⛔ | ⛔ | – | – | 🔒 | ✅ |
| Mark ready for dispatch | ⛔ | ⛔ | ⛔ | – | – | ✅ | ✅ |
| Inventory (view) | ⛔ | ⛔ | ⛔ | – | 👁 | 👁 | ✅ |
| **Edit price / tax / delivery fee** | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ |
| **Change order/payment status** | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅** |
| **Assign vehicle / logistics override** | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ |
| **Verify professionals** | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ |
| Translations / content / settings | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ |
| Audit logs | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | 👁 |

\* Contractor PO/credit usable only after admin approval (`companies.credit_approved`).
\*\* Status transitions triggered by customer/staff actions are executed by
service-role edge functions, not by direct table writes (see `WORKFLOWS.md`).

## Enforcement notes

- Customers have **no UPDATE policy** on `orders`, `inventory`, `payments`,
  `product_variants`, or `vehicles`. Price/status/fee changes require admin or a
  trusted service-role function. This satisfies §36 and AC #16.
- `professional_profiles.verified` is settable only via admin policy /
  server function (§23, AC #13).
- Catalogue tables are world-readable (anon `select`) but admin-write only.
```
