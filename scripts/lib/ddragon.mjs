/**
 * Minimal Data Dragon helpers (no deps).
 * Docs: https://developer.riotgames.com/docs/lol#data-dragon
 */

export async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

export async function getLatestVersion() {
  const versions = await fetchJson(
    "https://ddragon.leagueoflegends.com/api/versions.json",
  )
  return versions[0]
}

export function normAlnum(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]/g, "")
}
