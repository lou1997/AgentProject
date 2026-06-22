<template>
  <div class="container">
    <h2 class="page-title">&#128736; 用户管理</h2>
    <table class="admin-table" v-if="users.length > 0">
      <thead>
        <tr><th>用户名</th><th>角色</th><th>状态</th><th>操作</th><th>注册时间</th></tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id">
          <td>{{ escHtml(u.username) }}</td>
          <td><span :class="['role-badge', u.role]">{{ u.role === 'admin' ? '管理员' : '普通用户' }}</span></td>
          <td><span :class="['status-badge', u.muted ? 'muted' : 'active']">{{ u.muted ? '已禁言' : '正常' }}</span></td>
          <td>
            <template v-if="u.role !== 'admin'">
              <button v-if="u.muted" class="btn btn-sm btn-outline" @click="unmute(u.id)">解除禁言</button>
              <button v-else class="btn btn-sm btn-danger" @click="mute(u.id)">禁言</button>
            </template>
            <span v-else>-</span>
          </td>
          <td>{{ timeAgo(u.created_at) }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else style="text-align:center;color:var(--text-dim);padding:40px">加载中...</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import store from '../store'
import { api, escHtml, timeAgo } from '../api'

const router = useRouter()
const users = ref([])

onMounted(async () => {
  if (!store.currentUser || store.currentUser.role !== 'admin') {
    router.push('/')
    store.toast('无权限访问')
    return
  }
  await loadUsers()
})

async function loadUsers() {
  try {
    const data = await api('/admin/users')
    users.value = data.users
  } catch (e) { store.toast(e.message) }
}

async function mute(id) {
  if (!confirm('确定要禁言该用户吗？')) return
  try { await api(`/admin/users/${id}/mute`, { method: 'POST' }); store.toast('用户已被禁言'); await loadUsers() }
  catch (e) { store.toast(e.message) }
}

async function unmute(id) {
  try { await api(`/admin/users/${id}/unmute`, { method: 'POST' }); store.toast('已解除禁言'); await loadUsers() }
  catch (e) { store.toast(e.message) }
}
</script>
