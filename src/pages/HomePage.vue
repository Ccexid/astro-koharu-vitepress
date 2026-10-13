<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ArrowRight } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
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
  <div class="home-page">
    <div class="section-topline"><span>THE LATEST STORIES</span><span>01 / 02</span></div>
    <div class="section-title-row">
      <div>
        <p class="section-eyebrow">从这里，翻开新的一页</p>
        <h2>最近的文字 <span aria-hidden="true">✿</span></h2>
      </div>
      <RouterLink class="all-posts-link" to="/posts"
        >所有文章 <ArrowRight :size="16" aria-hidden="true"
      /></RouterLink>
    </div>
    <p v-if="loading" class="status-message" role="status">正在加载文章...</p>
    <div v-else-if="error" class="status-message" role="alert">
      文章暂时无法加载。<button type="button" @click="load">重试</button>
    </div>
    <PostFeed v-else :posts="posts.slice(0, 4)" :page-size="4" />
    <div class="home-more">
      <RouterLink to="/posts">继续阅读 <ArrowRight :size="16" aria-hidden="true" /></RouterLink>
    </div>
  </div>
</template>
