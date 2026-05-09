/**
 * Fails production builds if the client is configured to ship with a browser-exposed Riot key.
 * Loads .env / .env.production so `npm run build` picks up the same files Vite uses.
 */
import { config } from 'dotenv'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'

const root = process.cwd()
for (const name of ['.env', '.env.production', '.env.production.local']) {
  const p = resolve(root, name)
  if (existsSync(p)) config({ path: p })
}

if (process.env.VITE_ALLOW_CLIENT_RIOT_KEY === 'true') {
  console.error(
    '\n[verify-production-env] Refusing production build: VITE_ALLOW_CLIENT_RIOT_KEY=true.\n' +
      'Riot API keys must not be distributed in client apps. Remove this flag for store / Overwolf builds.\n',
  )
  process.exit(1)
}

const url = process.env.VITE_SUPABASE_URL ?? ''
const anon = process.env.VITE_SUPABASE_ANON_KEY ?? ''
if (!url || !anon || url.includes('YOUR_PROJECT') || anon === 'your-anon-key') {
  console.warn(
    '[verify-production-env] Warning: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing or still placeholder. Production builds need real Supabase values.\n',
  )
}
