<template>
  <div class="modal-overlay" :class="{ open: show }" @click.self="$emit('close')">
    <div class="modal modal-lg">
      <div class="modal-header">
        <h2>{{ bounty?.game_id ? `通缉令: ${bounty.game_id}` : '加载中...' }}</h2>
        <button class="modal-close" @click="$emit('close')">&times;</button>
      </div>
      <div v-if="bounty">
        <div class="detail-header">
          <div class="detail-target">&#128373; {{ escHtml(bounty.game_id) }}</div>
          <div class="detail-game">三角洲行动 &middot; <span :class="['bounty-status-tag', bounty.status]">{{ statusLabel(bounty.status) }}</span></div>
          <div class="detail-reason">{{ escHtml(bounty.reason) }}</div>
          <div class="detail-reward" v-if="bounty.reward">&#128176; 悬赏：{{ escHtml(bounty.reward) }}</div>
          <div class="detail-meta">
            <span>发布者：{{ escHtml(bounty.creator_name) }}</span>
            <span>{{ timeAgo(bounty.created_at) }}</span>
            <span v-if="bounty.hunter_name">猎人：{{ escHtml(bounty.hunter_name) }}</span>
          </div>
        </div>

        <div class="detail-actions" v-if="store.currentUser">
          <button v-if="bounty.status === 'active' && bounty.creator_id === store.currentUser.id" class="btn btn-sm btn-danger" @click="cancelBounty">撤销通缉</button>
          <button v-if="bounty.status === 'active' && bounty.creator_id !== store.currentUser.id" class="btn btn-sm btn-success" @click="huntBounty">&#127919; 接取通缉</button>
          <button v-if="bounty.status === 'hunting' && bounty.creator_id === store.currentUser.id" class="btn btn-sm btn-success" @click="completeBounty">&#9989; 确认完成</button>
        </div>

        <div class="comments-section">
          <h3>&#128172; 评论 ({{ comments.length }})</h3>
          <div v-if="store.token" class="comment-form">
            <input v-model="commentText" placeholder="添加评论..." @keyup.enter="addComment">
            <button class="btn btn-sm btn-primary" @click="addComment">发送</button>
          </div>
          <p v-else style="font-size:13px;color:var(--text-dim);margin-bottom:12px">登录后才能评论</p>
          <div class="comment-list">
            <div v-for="c in comments" :key="c.id" class="comment-item">
              <div class="comment-avatar">&#128100;</div>
              <div class="comment-body">
                <div class="comment-author">{{ escHtml(c.username) }}</div>
                <div class="comment-text">{{ escHtml(c.content) }}</div>
                <div class="comment-time">{{ timeAgo(c.created_at) }}</div>
              </div>
            </div>
            <p v-if="comments.length === 0" style="color:var(--text-dim);font-size:13px">暂无评论</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import store from '../store'
import { api, escHtml, timeAgo, statusLabel } from '../api'

const props = defineProps({ show: Boolean, bountyId: String })
const emit = defineEmits(['close', 'action'])

const bounty = ref(null)
const comments = ref([])
const commentText = ref('')

watch(() => [props.show, props.bountyId], async ([s, id]) => {
  if (s && id) {
    try {
      const data = await api(`/bounties/${id}`)
      bounty.value = data.bounty
      comments.value = data.comments
    } catch (e) { store.toast(e.message); emit('close') }
  }
})

async function huntBounty() {
  try { await api(`/bounties/${bounty.value.id}/hunt`, { method: 'POST' }); emit('close'); emit('action'); store.toast('接取成功！') }
  catch (e) { store.toast(e.message) }
}

async function cancelBounty() {
  if (!confirm('确定要撤销这条通缉令吗？')) return
  try { await api(`/bounties/${bounty.value.id}/cancel`, { method: 'POST' }); emit('close'); emit('action'); store.toast('已撤销') }
  catch (e) { store.toast(e.message) }
}

async function completeBounty() {
  if (!confirm('确认该猎人已完成任务？')) return
  try { await api(`/bounties/${bounty.value.id}/complete`, { method: 'POST' }); emit('close'); emit('action'); store.toast('通缉完成！') }
  catch (e) { store.toast(e.message) }
}

async function addComment() {
  const c = commentText.value.trim()
  if (!c) return
  try {
    await api(`/bounties/${bounty.value.id}/comments`, { method: 'POST', body: JSON.stringify({ content: c }) })
    commentText.value = ''
    const data = await api(`/bounties/${bounty.value.id}`)
    comments.value = data.comments
  } catch (e) { store.toast(e.message) }
}
</script>
