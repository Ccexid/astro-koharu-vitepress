<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { getPost } from '../services/posts'
import type { Post } from '../types/post'

const props = defineProps<{ slug: string }>()
const post = ref<Post | null>(null)
const loading = ref(true)
const error = ref(false)

async function loadPost(slug: string) {
  loading.value = true
  error.value = false
  post.value = null
  try {
    post.value = await getPost(slug)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => loadPost(props.slug))
watch(
  () => props.slug,
  (slug) => loadPost(slug),
)
</script>

<template>
  <p><RouterLink to="/">返回首页</RouterLink></p>
  <p v-if="loading">正在加载...</p>
  <p v-else-if="error" role="alert">文章加载失败。</p>
  <p v-else-if="!post">文章不存在。</p>
  <article v-else>
    <p class="meta">{{ post.category }} · {{ post.publishedAt }}</p>
    <h1>{{ post.title }}</h1>
    <p v-for="(paragraph, index) in post.body" :key="index">{{ paragraph }}</p>
  </article>
</template>
