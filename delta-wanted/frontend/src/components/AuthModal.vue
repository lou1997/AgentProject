<template>
  <div class="modal-overlay" :class="{ open: show }" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ mode === 'login' ? '登录' : '注册' }}</h2>
        <button class="modal-close" @click="$emit('close')">&times;</button>
      </div>
      <form @submit.prevent="submit">
        <input v-model="username" type="text" placeholder="用户名" required autocomplete="off">
        <input v-model="password" type="password" placeholder="密码" required autocomplete="off">
        <p v-if="error" class="form-error">{{ error }}</p>
        <button type="submit" class="btn btn-primary btn-block">{{ mode === 'login' ? '登录' : '注册' }}</button>
      </form>
      <p class="form-switch">
        <span>{{ mode === 'login' ? '还没有账号？' : '已有账号？' }}</span>
        <a href="#" @click.prevent="mode = mode === 'login' ? 'register' : 'login'; error = ''">{{ mode === 'login' ? '注册' : '登录' }}</a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import store from '../store'
import { api } from '../api'

defineProps({ show: Boolean })
const emit = defineEmits(['close'])

const mode = ref('login')
const username = ref('')
const password = ref('')
const error = ref('')

watch(() => props.show, () => { error.value = '' })

async function submit() {
  error.value = ''
  try {
    const data = await api(`/auth/${mode.value}`, {
      method: 'POST',
      body: JSON.stringify({ username: username.value.trim(), password: password.value })
    })
    store.setToken(data.token)
    store.setUser(data.user)
    emit('close')
    store.toast(mode.value === 'login' ? '登录成功' : '注册成功')
  } catch (e) {
    error.value = e.message
  }
}
</script>
