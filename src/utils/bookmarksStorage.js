/**
 * 书签：chrome.storage.local 存完整列表（容量大、可靠）；
 * chrome.storage.sync 存分片（绕过单键 ~8KB 限制），便于同一 Google 账号跨设备同步。
 * 读取时按 updatedAt 取较新一方（chunked sync > local > legacy 单键 sync）。
 */

const BOOKMARKS_KEY = 'bookmarks'
const MIGRATED_FLAG = '_bookmarksMigratedFromSync'
const LOCAL_META_KEY = 'bookmarks_meta'

export const SYNC_CHUNK_META_KEY = 'bm_chunks_v1_meta'
const CHUNK_PREFIX = 'bm_chunks_v1_'
/** sync 单键上限约 8KB，留出余量 */
const MAX_CHUNK_BYTES = 7000

const SOURCE_ORDER = { chunked: 0, local: 1, legacy: 2 }

function syncGet (keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(keys, (result) => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError)
      else resolve(result)
    })
  })
}

function syncSet (obj) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(obj, () => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError)
      else resolve()
    })
  })
}

function syncRemove (keys) {
  return new Promise((resolve, reject) => {
    if (!keys.length) {
      resolve()
      return
    }
    chrome.storage.sync.remove(keys, () => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError)
      else resolve()
    })
  })
}

function localGet (keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError)
      else resolve(result)
    })
  })
}

/**
 * sync 区域变化是否与书签分片/旧版键相关（用于 onChanged）
 */
export function bookmarkSyncAreaChanged (changes) {
  if (!changes) return false
  if (changes[SYNC_CHUNK_META_KEY]) return true
  if (changes[BOOKMARKS_KEY]) return true
  return Object.keys(changes).some((k) => k.startsWith(CHUNK_PREFIX))
}

function splitIntoChunks (bookmarks) {
  if (!Array.isArray(bookmarks) || bookmarks.length === 0) return []

  const chunks = []
  let current = []

  for (const b of bookmarks) {
    const next = [...current, b]
    if (JSON.stringify(next).length <= MAX_CHUNK_BYTES) {
      current = next
      continue
    }
    if (current.length > 0) {
      chunks.push(current)
      current = [b]
      if (JSON.stringify(current).length > MAX_CHUNK_BYTES) {
        chunks.push(current)
        current = []
      }
    } else {
      chunks.push([b])
    }
  }
  if (current.length > 0) chunks.push(current)
  return chunks
}

async function readChunkedSyncBookmarks () {
  const { [SYNC_CHUNK_META_KEY]: meta } = await syncGet([SYNC_CHUNK_META_KEY])
  if (!meta || typeof meta.n !== 'number') return null

  const updatedAt = Number(meta.updatedAt) || 0
  if (meta.n === 0) {
    return { list: [], updatedAt }
  }

  const keys = Array.from({ length: meta.n }, (_, i) => `${CHUNK_PREFIX}${i}`)
  const data = await syncGet(keys)
  const merged = []
  for (let i = 0; i < meta.n; i++) {
    const part = data[`${CHUNK_PREFIX}${i}`]
    if (!Array.isArray(part)) {
      throw new Error(`invalid bookmark chunk ${i}`)
    }
    merged.push(...part)
  }
  return { list: merged, updatedAt }
}

async function writeSyncChunks (bookmarks, updatedAt) {
  const chunks = splitIntoChunks(bookmarks)
  const prev = await syncGet([SYNC_CHUNK_META_KEY])
  const oldN = prev[SYNC_CHUNK_META_KEY]?.n ?? 0
  const newN = chunks.length

  const payload = {
    [SYNC_CHUNK_META_KEY]: { n: newN, updatedAt }
  }
  for (let i = 0; i < newN; i++) {
    payload[`${CHUNK_PREFIX}${i}`] = chunks[i]
  }

  await syncSet(payload)

  const toRemove = []
  for (let i = newN; i < oldN; i++) {
    toRemove.push(`${CHUNK_PREFIX}${i}`)
  }
  if (toRemove.length) await syncRemove(toRemove)
  await syncRemove([BOOKMARKS_KEY])
}

function pickMergedList (localList, localTime, chunked, legacyList) {
  const candidates = []

  if (chunked !== null) {
    candidates.push({
      list: chunked.list,
      t: Number(chunked.updatedAt) || 0,
      source: 'chunked'
    })
  }
  if (legacyList !== null) {
    candidates.push({
      list: legacyList,
      t: 0,
      source: 'legacy'
    })
  }
  candidates.push({
    list: Array.isArray(localList) ? localList : [],
    t: Number(localTime) || 0,
    source: 'local'
  })

  candidates.sort((a, b) => {
    if (b.t !== a.t) return b.t - a.t
    return SOURCE_ORDER[a.source] - SOURCE_ORDER[b.source]
  })

  return candidates[0].list
}

export function getBookmarks () {
  if (!chrome.storage?.local) {
    try {
      const raw = localStorage.getItem(BOOKMARKS_KEY)
      return Promise.resolve(raw ? JSON.parse(raw) : [])
    } catch (e) {
      return Promise.reject(e)
    }
  }

  return (async () => {
    const localResult = await localGet([BOOKMARKS_KEY, MIGRATED_FLAG, LOCAL_META_KEY])
    const localList = localResult[BOOKMARKS_KEY]
    const localTime = localResult[LOCAL_META_KEY]?.updatedAt ?? 0

    let chunked = null
    try {
      chunked = await readChunkedSyncBookmarks()
    } catch (e) {
      console.warn('bookmark sync chunks unreadable:', e)
    }

    let legacyList = null
    if (chunked === null) {
      const leg = await syncGet([BOOKMARKS_KEY])
      if (Array.isArray(leg[BOOKMARKS_KEY])) {
        legacyList = leg[BOOKMARKS_KEY]
      }
    }

    return pickMergedList(localList, localTime, chunked, legacyList)
  })()
}

export function setBookmarks (bookmarks) {
  const list = Array.isArray(bookmarks) ? bookmarks : []

  if (!chrome.storage?.local) {
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list))
      return Promise.resolve()
    } catch (e) {
      return Promise.reject(e)
    }
  }

  const now = Date.now()

  return new Promise((resolve, reject) => {
    chrome.storage.local.set(
      {
        [BOOKMARKS_KEY]: list,
        [MIGRATED_FLAG]: true,
        [LOCAL_META_KEY]: { updatedAt: now }
      },
      async () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
          return
        }
        try {
          await writeSyncChunks(list, now)
        } catch (e) {
          console.warn(
            'Bookmark sync to chrome.storage.sync failed (quota ~100KB total or item limit):',
            e
          )
        }
        resolve()
      }
    )
  })
}
