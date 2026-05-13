## 2026-05-12 - Centralized Input Validation for Riot API Proxy
**Vulnerability:** Insufficient input validation in Supabase Edge Functions. Parameters like `region`, `puuid`, and `gameName` were used directly in URL construction or API calls with only basic existence checks. This posed a risk of SSRF or path traversal if the `region` parameter was maliciously crafted (e.g., `../`).
**Learning:** Even though the `region` is appended to a known Riot domain, whitelisting is a more robust defense-in-depth strategy than relying on URL concatenation safety. Many functions shared similar validation needs, making a centralized utility in a shared module the most maintainable approach.
**Prevention:** Always use a whitelist for parameters that influence URL construction or external requests. Enforce length and format constraints (e.g., regex for PUUIDs) at the entry point of the server-side function.

## 2024-05-20 - Robust Input Validation for Riot Identifiers
**Vulnerability:** Edge functions like `tft-match-detail` and `tft-match-history` had missing or weak validation for `matchId` and `name` parameters, relying only on basic presence checks before using them in API requests.
**Learning:** Even when using `encodeURIComponent`, raw user input should be strictly validated against expected formats (e.g., Riot's `PLATFORM_ID_NUMBER` for match IDs) to prevent malformed requests and potential injection vectors in server-side logic.
**Prevention:** Implement strict format validation (regex) and character blacklisting (for naming) at the edge function entry point. Centralize these validators in a shared module to ensure consistent enforcement across all API endpoints.
