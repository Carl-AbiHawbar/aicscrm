# Required External Integrations

Deliverable #10 (§44). All third-party credentials live **only** in Supabase
Edge Function secrets (`supabase secrets set ...`) — never in `VITE_*` vars or
frontend code (§36).

| Concern | Provider (pluggable) | Where it runs | Secret(s) |
|---|---|---|---|
| Auth | Supabase Auth | built-in | — (anon key client-safe) |
| Database / Storage / RLS | Supabase | built-in | service-role (server only) |
| Card payments | Configurable (e.g. Stripe / HyperPay / Moyasar / Tap) | edge fn `create-payment`, `payment-webhook` | `PAYMENT_SECRET_KEY`, `PAYMENT_WEBHOOK_SECRET` |
| Maps / geocoding / distance | Google Maps or Mapbox | edge fn `geocode` + client map component | `MAPS_API_KEY` |
| SMS | Configurable (e.g. Twilio / Unifonic) | edge fn `notify` | `SMS_API_KEY` |
| WhatsApp | WhatsApp Business API / provider | edge fn `notify` | `WHATSAPP_TOKEN` |
| Email | Supabase SMTP or Resend/SendGrid | edge fn `notify` | `EMAIL_API_KEY` |
| AI (LLM) for ordering assistant | Configurable LLM provider | edge fn `ai-assistant` | `AI_API_KEY` |
| Speech-to-text (voice notes) | Configurable STT (EN/AR) | edge fn `transcribe` | `STT_API_KEY` |

## Payment safety (§19, AI Payment Safety)

- Never store raw card data. Card flow = redirect / hosted fields via provider.
- Order is marked paid **only** after verified webhook (`payment-webhook`),
  which sets `payments.status` and advances `orders.payment_status`.
- The AI assistant never collects card details in chat and never marks paid.

## Notification templates (§31)

`notify` renders bilingual (EN/AR) templates keyed by `notifications.template`
(account, order confirmation, payment received/failed, prepared, vehicle
assigned, dispatched, approaching, delivered/failed, quotation received/revised/
expiring, handyman message, appointment reminder, job completed, review request,
back-in-stock, claim update) across in-app / email / SMS / WhatsApp channels.

## Configurability (§41)

Providers and operational parameters (currency, tax, COD limit, free-delivery
threshold, safety-capacity %, quotation expiry, deposit rules, contractor
discount tiers, handyman commission, distance pricing, working hours, support
details) are stored in `system_settings` and editable from the admin dashboard —
not hard-coded.
```
