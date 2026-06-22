import store from './store'

const BASE = '/api'

function headers() {
  const h = { 'Content-Type': 'application/json' }
  if (store.token) h.Authorization = `Bearer ${store.token}`
  return h
}

export async function api(url, opts = {}) {
  const res = await fetch(BASE + url, { ...opts, headers: { ...headers(), ...(opts.headers || {}) } })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '请求失败')
  return data
}

export function timeAgo(dt) {
  const diff = Date.now() - new Date(dt).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  return new Date(dt).toLocaleDateString('zh-CN')
}

export function escHtml(s) {
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}

export function statusLabel(s) {
  const map = { active: '通缉中', hunting: '狩猎中', completed: '已完成', cancelled: '已撤销' }
  return map[s] || s
}
