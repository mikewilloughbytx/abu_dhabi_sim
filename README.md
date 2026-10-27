# Abu Dhabi 2021 Race Control

A teaching sim of the final laps of the 2021 Abu Dhabi Grand Prix. Players listen to the race, decide twice what race director Phillip does, hear one of twelve endings, and get their results by email.

- `public/`: the site (sim page, results page, privacy notice, audio, `sim-data.json` with the options and outcomes)
- `netlify/functions/`: `start-run` (issues a signed run token), `finish-run` (saves the run and sends the email), `runs` (facilitator results, password protected)
- `supabase/schema.sql`: the player log table

All audio is pre-rendered. The site contains no API keys; keys live only in Netlify's environment variables.

## Setup

1. **Supabase.** Create a project. In SQL Editor, run `supabase/schema.sql`. From Project Settings > API, copy the project URL and the `service_role` key.
2. **Resend.** Add and verify your sending domain (Domains > Add, then add the DNS records it shows at your registrar). Create an API key with "Sending access".
3. **Netlify.** Add new site > Import an existing project > GitHub > this repository. Build settings come from `netlify.toml`, so leave them as they are.
4. **Environment variables** (Netlify: Site configuration > Environment variables):

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL, e.g. `https://abcd.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase `service_role` key |
| `RESEND_API_KEY` | Resend API key |
| `RESULTS_FROM` | Sender, e.g. `Abu Dhabi Race Control <sim@yourdomain.com>` (must be on the verified domain) |
| `RUN_SECRET` | Any long random string (signs run tokens) |
| `ADMIN_PASSWORD` | Password for `/results.html` |
| `REPLY_TO` | Optional: where replies to the results email go (default mike@mike-willoughby.com) |
| `FACILITATOR_EMAIL` | Optional: also BCC every results email here |
| `MIN_RUN_SECONDS` | Optional: shortest run that gets an email (default 240) |
| `MAX_EMAILS_PER_DAY` | Optional: daily send cap (default 95, under Resend's free 100 a day) |

5. Redeploy (Deploys > Trigger deploy) so the functions pick up the variables.
6. Edit the contact address in `public/privacy.html`.

## Abuse protection

Results go only to the address entered, once per run. A run must last at least `MIN_RUN_SECONDS` from a server-issued token, each token can be used once, an address gets at most 3 emails an hour, and a hidden form field catches bots.

## Data retention

Runs should be deleted after 12 months (stated in the privacy notice). In Supabase SQL Editor:

```sql
delete from public.runs where created_at < now() - interval '12 months';
```
