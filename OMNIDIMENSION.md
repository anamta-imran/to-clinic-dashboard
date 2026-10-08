# OmniDimension integration

Agent: **T.O. Clinic Appointment Receptionist**  
Agent ID: `264841` (via `OMNIDIMENSION_AGENT_ID`)

## Architecture

```
OmniDimension post-call webhook
  → POST /api/webhooks/omnidimension
  → mapper + idempotent processor
  → SQLite (Prisma)
  → Dashboard / Appointments / Calls APIs
```

## Required environment variables

Copy `.env.example` to `.env` and set:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Default `file:./dev.db` |
| `OMNIDIMENSION_AGENT_ID` | Yes | `264841` |
| `OMNIDIMENSION_API_KEY` | For outbound API | Server-side Bearer token only |
| `OMNIDIMENSION_WEBHOOK_SECRET` | Recommended | Shared secret for webhook auth |

Never put these in `NEXT_PUBLIC_*` variables or client components.

## Configure OmniDimension post-call webhook

In the OmniDimension dashboard for agent `264841`:

1. Open **Post-call actions** → **Webhook**
2. Set URL to: `https://<your-public-host>/api/webhooks/omnidimension`
3. Include at least:
   - `summary`
   - `extracted_variables`
   - `fullConversation`
4. Prefer **Standard JSON** payload

Official references:

- https://docs.omnidim.io/docs/dashboard-guides/post-call
- https://docs.omnidim.io/docs/integrations/zapier-make-n8n
- https://docs.omnidim.io/docs/per-call-post-call-actions

## Expected payload fields (documented)

The mapper reads documented fields such as:

- `call_id`, `call_sid`
- `phone_number` / `from_number`
- `start_time`, `end_time`, `call_duration`, `call_status`
- `call_report.summary`
- `call_report.full_conversation`
- `call_report.interactions[]` (`bot_response`, `user_query`)
- `call_report.extracted_variables.*`

Transcript priority:

1. `call_report.interactions` (speaker-separated)
2. Labeled lines in `full_conversation` / `call_conversation`

If neither yields speaker turns, the UI shows:

> Transcript not available for this call.

## Appointment extraction

When the agent extracts booking variables, map keys such as:

- `patient_name` / `name`
- `appointment_date` / `date`
- `appointment_time` / `time`
- `doctor` / `doctor_name`
- `reason` / `appointment_reason`
- `appointment_booked`, `callback_requested`, `appointment_cancelled`

Exact variable keys depend on how the agent’s extracted variables are configured in OmniDimension. Adjust prompts there if needed; the mapper already accepts common aliases.

## Still required for live production

1. A publicly reachable HTTPS URL for the webhook
2. `OMNIDIMENSION_API_KEY` if you call OmniDimension REST APIs from the server
3. `OMNIDIMENSION_WEBHOOK_SECRET` and matching header/auth on OmniDimension (when available)
4. Agent post-call webhook pointed at `/api/webhooks/omnidimension` with `fullConversation` included

Until real calls arrive, the dashboard correctly shows **0** appointments/calls and empty states — no sample data is injected.
