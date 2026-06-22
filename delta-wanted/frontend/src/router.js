import { createRouter, createWebHistory } from 'vue-router'
import BountyList from './components/BountyList.vue'
import Messages from './components/Messages.vue'
import Profile from './components/Profile.vue'
import AdminPanel from './components/AdminPanel.vue'

const routes = [
  { path: '/', name: 'bounties', component: BountyList },
  { path: '/messages', name: 'messages', component: Messages },
  { path: '/profile', name: 'profile', component: Profile },
  { path: '/admin', name: 'admin', component: AdminPanel }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
