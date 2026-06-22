<template>
  <section>
    <div class="hero-banner">
      <h1>&#128083; 赛 博 通 缉 令</h1>
      <p>三角洲行动 | 挂逼追踪 | 恶意行为曝光 | 赏金猎人排行榜</p>
    </div>

    <div class="container">
      <div class="toolbar">
        <div class="filter-tabs">
          <button v-for="f in filters" :key="f.s" :class="['filter-tab', { active: currentFilter === f.s }]" @click="currentFilter = f.s; loadPage(1)">{{ f.label }}</button>
        </div>
        <button class="btn btn-danger" @click="openNewBounty">&#9876; 发布通缉令</button>
      </div>

      <div class="bounty-grid">
        <div v-for="b in bounties" :key="b.id" :class="['bounty-card', 'status-' + b.status]" @click="showDetail(b.id)">
          <div class="bounty-target">
            <div class="bounty-target-avatar">&#128373;</div>
            <div class="bounty-target-info">
              <h3>{{ escHtml(b.game_id) }}</h3>
              <span class="game">三角洲行动</span>
            </div>
          </div>
          <div class="bounty-reason">{{ escHtml(b.reason) }}</div>
          <div class="bounty-meta">
            <span>{{ escHtml(b.creator_name) }} &middot; {{ timeAgo(b.created_at) }}</span>
            <span>
              <span class="bounty-reward-tag" v-if="b.reward">&#128176; {{ escHtml(b.reward) }}</span>
              <span :class="['bounty-status-tag', b.status]">{{ statusLabel(b.status) }}</span>
            </span>
          </div>
        </div>
        <p v-if="bounties.length === 0" style="text-align:center;color:var(--text-dim);padding:40px">暂无通缉令</p>
      </div>

      <div class="pagination" v-if="totalPages > 1">
        <button v-for="p in totalPages" :key="p" :class="{ active: page === p }" @click="loadPage(p)">{{ p }}</button>
      </div>
    </div>

    <!-- New Bounty Modal -->
    <div class="modal-overlay" :class="{ open: showBountyModal }" @click.self="showBountyModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>&#9876; 发布通缉令</h2>
          <button class="modal-close" @click="showBountyModal = false">&times;</button>
        </div>
        <form @submit.prevent="createBounty">
          <label>游戏内 ID</label>
          <input v-model="form.game_id" type="text" placeholder="被通缉者的游戏ID" required>
          <label>通缉理由</label>
          <textarea v-model="form.reason" rows="4" placeholder="描述此人的恶意行为" required></textarea>
          <label>悬赏金额（可选）</label>
          <input v-model="form.reward" type="text" placeholder="例如：50万哈夫币 或 一件紫装">
          <p v-if="formError" class="form-error">{{ formError }}</p>
          <button type="submit" class="btn btn-danger btn-block">发布通缉令</button>
        </form>
      </div>
    </div>

    <!-- Bounty Detail Modal -->
    <BountyDetail :show="showDetailModal" :bounty-id="detailId" @close="showDetailModal = false" @action="loadPage(page)" />
  </section>
</template>

<script setup>
import { ref, watch } from 'vue'
import store from '../store'
import { api, escHtml, timeAgo, statusLabel } from '../api'
import BountyDetail from './BountyDetail.vue'

const filters = [
  { s: 'active', label: '&#128206; 活跃通缉' },
  { s: 'hunting', label: '&#127919; 狩猎中' },
  { s: 'completed', label: '&#9989; 已完成' },
  { s: 'all', label: '&#128203; 全部' }
]

const currentFilter = ref('active')
const bounties = ref([])
const page = ref(1)
const totalPages = ref(0)
const showBountyModal = ref(false)
const showDetailModal = ref(false)
const detailId = ref('')
const form = ref({ game_id: '', reason: '', reward: '' })
const formError = ref('')

watch(currentFilter, () => loadPage(1), { immediate: true })

async function loadPage(p) {
  page.value = p
  try {
    const data = await api(`/bounties?status=${currentFilter.value}&page=${p}&limit=12`)
    bounties.value = data.bounties
    totalPages.value = data.totalPages
  } catch (e) { store.toast(e.message) }
}

function openNewBounty() {
  if (!store.token) { store.toast('请先登录'); return }
  showBountyModal.value = true
}

async function createBounty() {
  formError.value = ''
  try {
    await api('/bounties', { method: 'POST', body: JSON.stringify(form.value) })
    showBountyModal.value = false
    form.value = { game_id: '', reason: '', reward: '' }
    store.toast('通缉令发布成功！')
    loadPage(1)
  } catch (e) { formError.value = e.message }
}

function showDetail(id) {
  detailId.value = id
  showDetailModal.value = true
}
</script>
