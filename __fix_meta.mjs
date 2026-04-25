import fs from 'fs'

let data = JSON.parse(fs.readFileSync('public/metaComps.json', 'utf8'))

const validChamps = new Set([
  "Aatrox","Briar","Caitlyn","Cho'Gath","Ezreal","Leona","Lissandra","Nasus","Poppy","Rek'Sai","Talon","Teemo","Twisted Fate","Veigar",
  "Akali","Bel'Veth","Gnar","Gragas","Gwen","Jax","Jinx","Meepsie","Milio","Mordekaiser","Pantheon","Pyke","Zoe",
  "Aurora","Diana","Fizz","Illaoi","Kai'Sa","Lulu","Maokai","Ornn","Samira","Urgot","Viktor",
  "Aurelion Sol","Corki","Karma","Kindred","Leblanc","Master Yi","Nami","Nunu","Rammus","Riven","The Mighty Mech","Xayah",
  "Bard","Blitzcrank","Fiora","Jhin","Sona"
])

const replaceMap = {
  "Miss Fortune": "Gwen",
  "Vex": "Master Yi"
}

for (const comp of data) {
  comp.requiredUnits = comp.requiredUnits.map(u => replaceMap[u] || u)
  for (const carry of comp.carries) {
    if (replaceMap[carry.name]) {
      carry.name = replaceMap[carry.name]
    }
  }
}

fs.writeFileSync('public/metaComps.json', JSON.stringify(data, null, 2))
fs.writeFileSync('dist/metaComps.json', JSON.stringify(data, null, 2))
console.log('fixed metaComps.json')

// Validate
const allUnits = new Set()
for (const comp of data) {
  for (const u of comp.requiredUnits) allUnits.add(u)
}
const invalid = [...allUnits].filter(u => !validChamps.has(u))
if (invalid.length > 0) {
  console.error('INVALID CHAMPIONS:', invalid)
  process.exit(1)
} else {
  console.log('All champions valid!')
}
