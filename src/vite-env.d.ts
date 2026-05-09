/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Never enable in production builds. Riot API keys must not ship in client apps. */
  readonly VITE_ALLOW_CLIENT_RIOT_KEY?: string
  /** Optional absolute URL to privacy policy for store / Riot forms. */
  readonly VITE_PRIVACY_POLICY_URL?: string
  /** Optional absolute URL to terms of use (defaults to BASE_URL/terms.html). */
  readonly VITE_TERMS_OF_SERVICE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
