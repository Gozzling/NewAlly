import type { LobbyPlayer } from '../types/riot'

const LOCKFILE_NAME = 'lockfile'
const LCU_PATHS = [
  'C:/Riot Games/League of Legends/',
  'D:/Riot Games/League of Legends/',
  'E:/Riot Games/League of Legends/',
]

interface Lockfile {
  name: string
  pid: number
  port: number
  password: string
  protocol: string
}

function parseLockfile(content: string): Lockfile | null {
  const parts = content.split(':')
  if (parts.length !== 5) return null
  return {
    name: parts[0],
    pid: parseInt(parts[1], 10),
    port: parseInt(parts[2], 10),
    password: parts[3],
    protocol: parts[4],
  }
}

function encodeAuth(password: string): string {
  return btoa(`riot:${password}`)
}

/**
 * Attempt to read the League Client lockfile via Overwolf's file system API.
 * Falls back gracefully if not available.
 */
export async function readLockfile(): Promise<Lockfile | null> {
  const fs = (window as any).overwolf?.extensions?.io?.fileSystem
  if (!fs) {
    console.warn('[LCU] Overwolf fileSystem API not available')
    return null
  }

  for (const dir of LCU_PATHS) {
    try {
      const content = await new Promise<string | null>((resolve) => {
        fs.readTextFile(`${dir}${LOCKFILE_NAME}`, (result: any) => {
          resolve(result?.success ? result.content : null)
        })
      })
      if (content) {
        const parsed = parseLockfile(content)
        if (parsed) return parsed
      }
    } catch {
      // try next path
    }
  }
  return null
}

async function lcuRequest<T>(path: string, lockfile: Lockfile): Promise<T | null> {
  const url = `${lockfile.protocol}://127.0.0.1:${lockfile.port}${path}`
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Basic ${encodeAuth(lockfile.password)}` },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function getLobbyPlayers(): Promise<LobbyPlayer[]> {
  const lockfile = await readLockfile()
  if (!lockfile) {
    console.warn('[LCU] Lockfile not found — returning empty lobby')
    return []
  }

  const lobby = await lcuRequest<any>('/lol-lobby/v2/lobby', lockfile)
  if (!lobby?.members) return []

  const members: Array<{ summonerId: number; summonerName: string }> = lobby.members
  return members.map((m) => ({
    summonerName: m.summonerName,
    summonerId: String(m.summonerId),
  }))
}
