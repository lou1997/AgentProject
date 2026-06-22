import { reactive } from 'vue'

const store = reactive({
  currentUser: null,
  token: localStorage.getItem('token') || '',
  toastMessage: '',
  toastVisible: false,

  setUser(user) {
    this.currentUser = user
  },

  setToken(token) {
    this.token = token
    localStorage.setItem('token', token)
  },

  clearAuth() {
    this.currentUser = null
    this.token = ''
    localStorage.removeItem('token')
  },

  toast(msg) {
    this.toastMessage = msg
    this.toastVisible = true
    setTimeout(() => { this.toastVisible = false }, 2500)
  }
})

export default store
