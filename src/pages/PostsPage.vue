<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PageHeading from '@/components/PageHeading.vue'
import PostFeed from '@/components/PostFeed.vue'
import { listPosts } from '@/services/posts'
import type { Post } from '@/types/post'

const posts = ref<Post[]>([])
const loading = ref(true)
const error = ref(false)

async function load() {
  loading.value = true
  error.value = false
  try {
    posts.value = await listPosts()
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <PageHeading title="所有文章" eyebrow="POSTS" description="把途中的所见所想，都认真放在这里。" />
  <p v-if="loading" class="status-message" role="status">正在加载文章...</p>
  <div v-else-if="error" class="status-message" role="alert">
    文章暂时无法加载。<button type="button" @click="load">重试</button>
  </div>
  <PostFeed v-else :posts="posts" searchable />
</template>
