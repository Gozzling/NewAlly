export type CanonicalDataVersion = {
  set: number
  patch: string
  locale: string
}

export function catalogVersionKey(version: CanonicalDataVersion): string {
  return `${version.set}:${version.patch}:${version.locale}`
}

/** Archived / live catalog path: `catalogs/{set}/{patch}/` */
export function patchCatalogPath(version: CanonicalDataVersion): string {
  return `catalogs/${version.set}/${version.patch}`
}
