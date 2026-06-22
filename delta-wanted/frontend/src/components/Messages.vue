<template>
  <div class="container">
    <h2 class="page-title">&#128172; 私信</h2>
    <div class="msg-layout">
      <div class="msg-list">
        <div class="msg-list-header">
          <h3>对话列表</h3>
          <button class="btn btn-sm btn-outline" @click="showNewMsg = true">+ 新消息</button>
        </div>
        <div v-for="c in conversations" :key="c.id" :class="['conv-item', { active: chatUserId === c.id }]" @click="openChat(c)">
          <div class="conv-avatar">&#128100;</div>
          <div class="conv-info">
            <div class="conv-name">{{ escHtml(c.username) }}</div>
            <div class="conv-last">{{ escHtml(c.last_msg || '') }}</div>
          </div>
          <span class="conv-unread" v-if="c.unread > 0">{{ c.unread }}</span>
        </div>
        <div v-if="conversations.length === 0" style="padding:20px;text-align:center;color:var(--text-dim);font-size:13px">暂无对话</div>
      </div>

      <div class="msg-chat" v-if="chatUserId">
        <div class="chat-header"><h3>&#128100; {{ escHtml(chatUserName) }}</h3></div>
        <div class="chat-messages" ref="msgContainer">
          <div v-for="m in messages" :key="m.id" :class="['chat-msg', m.from_id === store.currentUser?.id ? 'sent' : 'received']">
            {{ escHtml(m.content) }}
            <div class="chat-msg-time">{{ timeAgo(m.created_at) }}</div>
          </div>
        </div>
        <div class="chat-input">
          <input v-model="msgText" placeholder="输入消息..." @keyup.enter="sendMessage">
          <button class="btn btn-sm btn-primary" @click="sendMessage">发送</button>
        </div>
      </div>
      <div class="chat-empty" v-else>选择对话开始聊天</div>
    </div>

    <!-- New Message Modal -->
    <div class="modal-overlay" :class="{ open: showNewMsg }" @click.self="showNewMsg = false">
      <div class="modal">
        <div class="modal-header">
          <h2>&#128172; 新私信</h2>
          <button class="modal-close" @click="showNewMsg = false">&times;</button>
        </div>
        <input v-model="searchQuery" type="text" placeholder="搜索用户名..." @input="searchUsers">
        <div class="user-search-list">
          <div v-for="u in searchResults" :key="u.id" class="user-search-item" @click="startChat(u); showNewMsg = false">
            <div style="width:32px;height:32px;border-radius:50%;background:var(--bg-surface);display:flex;align-items:center;justify-content:center">&#128100;</div>
            <span>{{ escHtml(u.username) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import store from '../store'
import { api, escHtml, timeAgo } from '../api'

const conversations = ref([])
const chatUserId = ref('')
const chatUserName = ref('')
const messages = ref([])
const msgText = ref('')
const msgContainer = ref(null)
const showNewMsg = ref(false)
const searchQuery = ref('')
const searchResults = ref([])

async function loadConversations() {
  if (!store.token) return
  try {
    const data = await api('/messages/conversations')
    conversations.value = data.conversations
  } catch (e) { /* ignore */ }
}

async function openChat(c) {
  chatUserId.value = c.id
  chatUserName.value = c.username
  await loadMessages()
}

async function loadMessages() {
  try {
    const data = await api(`/messages/with/${chatUserId.value}`)
    messages.value = data.messages
    nextTick(() => { if (msgContainer.value) msgContainer.value.scrollTop = msgContainer.value.scrollHeight })
  } catch (e) { store.toast(e.message) }
}

async function sendMessage() {
  const c = msgText.value.trim()
  if (!c) return
  try {
    await api('/messages', { method: 'POST', body: JSON.stringify({ to_id: chatUserId.value, content: c }) })
    msgText.value = ''
    await loadMessages()
  } catch (e) { store.toast(e.message) }
}

async function searchUsers() {
  const q = searchQuery.value.trim()
  if (q.length < 1) { searchResults.value = []; return }
  try {
    const data = await api(`/users/search?q=${encodeURIComponent(q)}`)
    searchResults.value = data.users
  } catch (e) { searchResults.value = [] }
}

function startChat(u) {
  chatUserId.value = u.id
  chatUserName.value = u.username
  loadConversations()
  loadMessages()
}

loadConversations()
</script>
