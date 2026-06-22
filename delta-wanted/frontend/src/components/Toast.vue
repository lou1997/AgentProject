<template>
  <div class="toast" :class="{ show: store.toastVisible }">{{ store.toastMessage }}</div>
</template>

<script setup>
import store from '../store'
</script>
