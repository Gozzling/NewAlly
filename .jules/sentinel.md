## 2026-05-12 - Centralized Input Validation for Riot API Proxy
**Vulnerability:** Insufficient input validation in Supabase Edge Functions. Parameters like `region`, `puuid`, and `gameName` were used directly in URL construction or API calls with only basic existence checks. This posed a risk of SSRF or path traversal if the `region` parameter was maliciously crafted (e.g., `../`).
**Learning:** Even though the `region` is appended to a known Riot domain, whitelisting is a more robust defense-in-depth strategy than relying on URL concatenation safety. Many functions shared similar validation needs, making a centralized utility in a shared module the most maintainable approach.
**Prevention:** Always use a whitelist for parameters that influence URL construction or external requests. Enforce length and format constraints (e.g., regex for PUUIDs) at the entry point of the server-side function.

## 2026-05-13 - Extended Centralized Validation for Match IDs
**Vulnerability:** Missing validation for Match IDs in proxy functions. Malformed match IDs could potentially be used for path traversal or internal API probing if passed unsanitized to the Riot API regional endpoints.
**Learning:** Shared validation logic should be as granular as possible. Centralizing `validateMatchId` alongside `validatePuuid` and `validateRegion` ensures consistent safety across all match-related edge functions.
**Prevention:** Always validate all parameters influencing downstream API requests, even if they are intermediary results (like match IDs returned from another API call), to maintain defense-in-depth.
