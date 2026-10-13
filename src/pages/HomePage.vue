<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { listPosts } from '../services/posts'
import type { Post } from '../types/post'

const posts = ref<Post[]>([])
const loading = ref(true)
const error = ref(false)

onMounted(async () => {
  try {
    posts.value = await listPosts()
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="intro">
    <h1>Koharu</h1>
    <p>Vue 3 + Vite + TypeScript 静态页面模板</p>
  </section>
  <section aria-labelledby="posts-title">
    <h2 id="posts-title">文章</h2>
    <p v-if="loading">正在加载...</p>
    <p v-else-if="error" role="alert">文章加载失败。</p>
    <p v-else-if="posts.length === 0">暂无文章。</p>
    <ul v-else class="post-list">
      <li v-for="post in posts" :key="post.id">
        <article>
          <p class="meta">{{ post.category }} · {{ post.publishedAt }}</p>
          <h3>
            <RouterLink :to="`/posts/${post.slug}`">{{ post.title }}</RouterLink>
          </h3>
          <p>{{ post.excerpt }}</p>
        </article>
      </li>
    </ul>
  </section>
</template>
