import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { api } from './api'

const app = createApp(App)
app.use(router)
app.mount('#app')

router.beforeEach(async (to, from, next) => {
  if (store.token && !store.currentUser) {
    try {
      const data = await api('/auth/me')
      store.setUser(data.user)
    } catch (e) {
      store.clearAuth()
    }
  }
  next()
})
