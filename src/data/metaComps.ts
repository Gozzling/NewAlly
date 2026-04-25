import type { MetaComp } from '../types/tft'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const data: MetaComp[] = require('../../public/metaComps.json') as MetaComp[]
export const META_COMPS: MetaComp[] = data
