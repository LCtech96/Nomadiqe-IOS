# Madi AI — `quick-responder` Edge Function

Powers in-app chat with Madi via Google Gemini. Source lives in [`supabase/functions/quick-responder/`](../supabase/functions/quick-responder/).

## Secrets

In Supabase Dashboard → **Project Settings → Edge Functions → Secrets**:

| Name | Description |
|------|-------------|
| `GEMINI_API_KEY` | Google AI Studio / Gemini API key |

## Deploy

From the project root (requires [Supabase CLI](https://supabase.com/docs/guides/cli)):

```bash
supabase login
supabase link --project-ref sbmginfbpcogjoxrdphi
supabase functions deploy quick-responder
```

Or paste `supabase/functions/quick-responder/index.ts` and `systemInstruction.ts` into the Supabase Dashboard editor for **Edge Functions → quick-responder**.

## Request body (from iOS app)

```json
{
  "message": "What's the Wi-Fi password?",
  "history": [
    { "role": "user", "text": "..." },
    { "role": "model", "text": "..." }
  ],
  "property_id": "0f8f...e21a"
}
```

- `message` (required): latest user message
- `history` (optional): up to 12 prior turns for triage context
- `property_id` (optional): UUID of a property. When present, the function loads that
  property's row from `property_guides` and appends it to the system instruction, so Madi
  answers guest questions (Wi-Fi, check-in times, house rules, local tips) with the host's
  own details.

The guide is fetched through PostgREST with the caller's `Authorization` header, so row
level security decides access: hosts see their own guides, creators see guides they were
granted via `property_guide_access`. If the caller has no access, the guide is missing, or
the lookup fails, the function silently falls back to the generic Madi instruction.

## Response

```json
{ "reply": "..." }
```

On error: `{ "error": "..." }` with HTTP 4xx/5xx.
