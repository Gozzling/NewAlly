#!/usr/bin/env node
/**
 * Full Set data sync: Community Dragon → tft-static → fallback-seed.json
 */
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: true })
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))))
  })
}

async function main() {
  await run('node', ['scripts/parse-tft-static-data.mjs', '--set', '17'])
  await run('node', ['scripts/generate-fallback-seed.mjs'])
  console.log('sync-all complete')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
