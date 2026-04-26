import fs from 'fs'

const lines = fs.readFileSync('Gods.txt', 'utf8').split('\n')

// Find "Augments" section
let augStart = lines.findIndex(l => l.trim() === 'Augments')
console.log('Augments section at line:', augStart + 1)

const augments = []
if (augStart >= 0) {
  let i = augStart + 1
  while (i < lines.length) {
    const l = lines[i].trim()
    if (!l) { i++; continue }
    if (/^(2-1|3-2|4-2|0)$/.test(l)) { i++; continue }
    
    // Check if next line is same name (duplicate name line)
    if (i + 1 < lines.length && lines[i+1].trim() === l) {
      const name = l
      const desc = (lines[i+2] || '').trim()
      i += 3
      while (i < lines.length && /^(2-1|3-2|4-2|0)$/.test(lines[i].trim())) i++
      if (name !== 'Augments' && desc) {
        augments.push({name, desc})
      }
      continue
    }
    i++
  }
}

console.log(`Found ${augments.length} augments`)
fs.writeFileSync('__regular_augs.json', JSON.stringify(augments, null, 2))

// Parse hero augments
const heroAugments = []
for (let i = 0; i < augStart; i++) {
  const l = lines[i].trim()
  if (l.startsWith('Hero Augment:')) {
    const name = l.replace('Hero Augment:', '').trim()
    // find prev non-empty line that looks like a champion name
    let champ = ''
    for (let j = i-1; j >= 0; j--) {
      const pl = lines[j].trim()
      if (pl && !pl.startsWith('Cost') && !pl.startsWith('Traits') && !pl.startsWith('Role') && 
          !pl.startsWith('Range') && !pl.startsWith('Attack') && !pl.startsWith('Ability') &&
          !pl.startsWith('Mana') && !pl.startsWith('Damage') && !pl.startsWith('Recommended') &&
          !pl.startsWith('Item') && !pl.startsWith('Tier') && !pl.startsWith('Description') &&
          !pl.startsWith('Effect') && pl.length < 40 && !pl.includes(':') && !pl.startsWith('===')) {
        champ = pl
        break
      }
    }
    // read description
    let desc = ''
    for (let j = i+1; j < augStart; j++) {
      const dl = lines[j].trim()
      if (!dl || dl.startsWith('Cost') || dl.startsWith('Traits') || dl.startsWith('Role') ||
          dl.startsWith('Range') || dl.startsWith('Attack') || dl.startsWith('Ability') ||
          dl.startsWith('Mana') || dl.startsWith('Damage') || dl.startsWith('Recommended') ||
          dl.startsWith('Item') || dl.startsWith('Hero Augment:') || dl.startsWith('===')) break
      if (!desc) desc = dl
    }
    if (name && desc) heroAugments.push({name: `${champ}: ${name}`, desc})
  }
}

console.log(`Found ${heroAugments.length} hero augments`)
fs.writeFileSync('__hero_augs.json', JSON.stringify(heroAugments, null, 2))
