const CONFIG_KEY = 'louie_dashboard_config'

function getConfig() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}')
  } catch {
    return {}
  }
}

export function getApiUrl() {
  return getConfig().apiUrl || 'http://localhost:3141'
}

export function getToken() {
  return getConfig().token || ''
}

export function getChatId() {
  return getConfig().chatId || ''
}

export function saveConfig(apiUrl, token, chatId) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ apiUrl, token, chatId }))
}

export async function apiFetch(path, options = {}) {
  const base = getApiUrl()
  const token = getToken()
  const chatId = getChatId()
  const sep = path.includes('?') ? '&' : '?'
  const url = `${base}${path}${sep}token=${token}&chatId=${chatId}`
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
  return res.json()
}
