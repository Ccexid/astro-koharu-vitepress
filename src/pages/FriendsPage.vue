<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ArrowUpRight } from 'lucide-vue-next'
import PageHeading from '../components/PageHeading.vue'
import { listFriends } from '../services/posts'
import type { Friend } from '../types/post'

const friends = ref<Friend[]>([])
const loading = ref(true)
const error = ref(false)

async function load() {
  loading.value = true
  error.value = false
  try {
    friends.value = await listFriends()
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <PageHeading title="友人来信" eyebrow="FRIENDS" description="去看看这些有趣的角落，遇见不同的日常。" />
  <p v-if="loading" class="status-message" role="status">正在加载友链...</p>
  <div v-else-if="error" class="status-message" role="alert">
    友链暂时无法加载。<button type="button" @click="load">重试</button>
  </div>
  <div v-else-if="friends.length" class="friends-grid">
    <a
      v-for="friend in friends"
      :key="friend.url"
      :href="friend.url"
      target="_blank"
      rel="noopener noreferrer"
      class="friend-item"
    >
      <span class="friend-avatar" aria-hidden="true">{{ friend.initial }}</span>
      <span class="friend-copy"
        ><strong>{{ friend.name }}</strong
        ><small>{{ friend.description }}</small></span
      >
      <ArrowUpRight :size="17" aria-hidden="true" />
    </a>
  </div>
  <p v-else class="status-message">这里暂时还没有友链。</p>
  <p class="friends-note">这里展示的是模板示例站点，链接尚未指向真实博客。</p>
</template>
