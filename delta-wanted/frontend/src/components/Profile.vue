<template>
  <div class="container">
    <div class="profile-card" v-if="profile">
      <div class="profile-header">
        <div class="profile-avatar">{{ profile.user.username[0] }}</div>
        <div class="profile-info">
          <h2>{{ profile.user.username }}</h2>
          <p>加入于 {{ timeAgo(profile.user.created_at) }}</p>
        </div>
      </div>
      <div class="profile-stats">
        <div class="stat-item"><div class="num">{{ profile.stats.posted }}</div><div class="label">发布通缉</div></div>
        <div class="stat-item"><div class="num">{{ profile.stats.hunted }}</div><div class="label">完成狩猎</div></div>
        <button class="btn btn-sm btn-outline" style="margin-left:auto" @click="logout">退出登录</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import store from '../store'
import { api, timeAgo } from '../api'

const router = useRouter()
const profile = ref(null)

onMounted(async () => {
  if (!store.currentUser) { router.push('/'); return }
  try {
    const data = await api(`/users/${store.currentUser.id}`)
    profile.value = data
  } catch (e) { store.toast(e.message) }
})

function logout() {
  store.clearAuth()
  router.push('/')
  store.toast('已退出登录')
}
</script>
