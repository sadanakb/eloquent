const PREFIX = 'eloquent_'

function isAvailable() {
  try {
    const key = PREFIX + '__test__'
    localStorage.setItem(key, '1')
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

function get(key, fallback) {
  if (!isAvailable()) return fallback
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function set(key, value) {
  if (!isAvailable()) return
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // quota exceeded or other write failure — silently ignore
  }
}

function remove(key) {
  if (!isAvailable()) return
  localStorage.removeItem(PREFIX + key)
}

function has(key) {
  if (!isAvailable()) return false
  return localStorage.getItem(PREFIX + key) !== null
}

export default { get, set, remove, has }
