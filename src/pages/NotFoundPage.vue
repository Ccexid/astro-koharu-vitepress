<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="empty-page">
    <p class="empty-symbol">404</p>
    <h1>这条小路还没有被写下</h1>
    <p>你访问的页面不存在，可以返回首页重新出发。</p>
    <RouterLink to="/"><ArrowLeft :size="16" aria-hidden="true" /> 返回首页</RouterLink>
  </div>
</template>
