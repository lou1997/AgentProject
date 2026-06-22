<template>
  <div>
    <header class="topbar">
      <div class="topbar-inner">
        <router-link to="/" class="logo">
          <span class="logo-icon">&#128083;</span>
          <span class="logo-text">赛博通缉令</span>
          <span class="logo-sub">三角洲行动</span>
        </router-link>
        <nav class="topbar-nav">
          <router-link to="/" class="nav-link" active-class="active" exact>通缉大厅</router-link>
          <router-link to="/messages" class="nav-link" active-class="active">
            私信
            <span class="unread-badge" v-if="unreadCount > 0">{{ unreadCount }}</span>
          </router-link>
          <router-link to="/admin" class="nav-link" active-class="active" v-if="store.currentUser?.role === 'admin'">管理</router-link>
        </nav>
        <div class="topbar-right">
          <span>{{ store.currentUser ? store.currentUser.username : '未登录' }}</span>
          <button v-if="!store.currentUser" class="btn btn-outline" @click="showAuth = true">登录</button>
          <button v-else class="btn btn-primary" @click="$router.push('/profile')">我</button>
        </div>
      </div>
    </header>

    <main>
      <router-view />
    </main>

    <AuthModal :show="showAuth" @close="showAuth = false" />

    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import store from './store'
import { api } from './api'
import AuthModal from './components/AuthModal.vue'
import Toast from './components/Toast.vue'

const showAuth = ref(false)
const unreadCount = ref(0)
let pollTimer = null

function pollUnread() {
  if (!store.token) return
  api('/messages/conversations').then(data => {
    unreadCount.value = data.conversations.reduce((s, c) => s + c.unread, 0)
  }).catch(() => {})
}

onMounted(() => {
  store.setUser = store.setUser.bind(store) // keep original, override to trigger UI update
  const origSetUser = store.setUser
  const origClearAuth = store.clearAuth
  store.setUser = function(u) { origSetUser(u); pollUnread() }
  store.clearAuth = function() { origClearAuth(); unreadCount.value = 0 }

  pollTimer = setInterval(pollUnread, 15000)
})

onUnmounted(() => clearInterval(pollTimer))
</script>
