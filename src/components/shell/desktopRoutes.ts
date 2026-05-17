/** Content padding: match-list / guide pages manage their own gutters. */
export const DESKTOP_FULL_BLEED_ROUTES = new Set([
  'units',
  'traits',
  'items',
  'augments',
  'god-boons',
  'team-builder',
  'match-history',
])

export function isDesktopFullBleedRoute(route: string): boolean {
  return DESKTOP_FULL_BLEED_ROUTES.has(route)
}
