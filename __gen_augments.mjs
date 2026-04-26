import fs from 'fs'
const lines = fs.readFileSync('Gods.txt', 'utf8').split('\n')
let start = lines.findIndex(l => l.trim() === 'Augments')
const augs = []
if (start >= 0) {
  let i = start + 1
  while (i < lines.length) {
    const l = lines[i].trim()
    if (!l || /^(2-1|3-2|4-2|0)$/.test(l)) { i++; continue }
    if (i + 1 < lines.length && lines[i+1].trim() === l) {
      const name = l, desc = (lines[i+2] || '').trim()
      i += 3
      while (i < lines.length && /^(2-1|3-2|4-2|0)$/.test(lines[i].trim())) i++
      if (name !== 'Augments' && desc) augs.push({name, desc})
      continue
    }
    i++
  }
}
let out = `export interface Augment { id: string; name: string; tier: 'prismatic'|'gold'|'silver'|'hero'; description: string; effect: string; bestComps: string[]; pickRate: number; winRate: number; avgPlacement: number; synergies: string[]; counters: string[]; tags: string[]; }\nexport const AUGMENT_TIERS = ['silver', 'gold', 'prismatic', 'hero'] as const\nexport const AUGMENTS: Augment[] = [\n`
for (const a of augs) {
  let t = 'silver'
  if (a.name.includes('III') || a.name.includes('++')) t = 'prismatic'
  else if (a.name.includes('II') || a.name.includes('+')) t = 'gold'
  const id = 'aug_' + a.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+$/, '')
  const eff = a.desc.length > 60 ? a.desc.slice(0, 60) + '...' : a.desc
  const tags = t === 'silver' ? ['early'] : t === 'gold' ? ['mid'] : ['late']
  out += `  {id:"${id}",name:"${a.name}",tier:"${t}",description:"${a.desc}",effect:"${eff}",bestComps:["Any"],pickRate:15.0,winRate:50.0,avgPlacement:4.0,synergies:[],counters:[],tags:${JSON.stringify(tags)}},\n`
}
out += `]\n`
fs.writeFileSync('src/data/augments.ts', out)
console.log('Wrote', augs.length, 'augments')
