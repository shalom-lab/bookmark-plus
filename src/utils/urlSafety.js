/** 禁止在 <a href> 与存储中使用的危险协议（导入/展示/保存均参考） */
const BLOCKED_PROTOCOLS = new Set(['javascript:', 'data:', 'vbscript:'])

/**
 * 规范化用户输入的 URL；拒绝危险 protocol。用于保存与导入。
 * @param {string} raw
 * @returns {string|null}
 */
export function normalizeUserUrlInput (raw) {
  const trimmed = (raw || '').trim()
  if (!trimmed) return null
  let u
  try {
    u = new URL(trimmed)
  } catch {
    try {
      u = new URL(`https://${trimmed}`)
    } catch {
      return null
    }
  }
  if (BLOCKED_PROTOCOLS.has(u.protocol.toLowerCase())) return null
  return u.href
}

/**
 * 列表中打开链接：危险协议退化为 “#”，避免点击执行脚本。
 * @param {string} raw
 * @returns {string}
 */
export function safeBookmarkHref (raw) {
  if (!raw || typeof raw !== 'string') return '#'
  try {
    const u = new URL(raw.trim())
    if (BLOCKED_PROTOCOLS.has(u.protocol.toLowerCase())) return '#'
    return u.href
  } catch {
    return '#'
  }
}
