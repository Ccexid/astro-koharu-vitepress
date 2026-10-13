<script setup lang="ts">
import { ArrowLeft, ArrowRight } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import type { Post } from '@/types/post'

defineProps<{
  post: Post
  direction: 'prev' | 'next'
}>()
</script>

<template>
  <RouterLink class="post-pagination-card" :data-dir="direction" :to="`/posts/${post.slug}`" :rel="direction">
    <span class="post-pagination-label">
      <ArrowLeft v-if="direction === 'prev'" class="post-pagination-arrow" :size="16" aria-hidden="true" />
      {{ direction === 'prev' ? '上一篇' : '下一篇' }}
      <ArrowRight v-if="direction === 'next'" class="post-pagination-arrow" :size="16" aria-hidden="true" />
    </span>
    <span class="post-pagination-title">{{ post.title }}</span>
  </RouterLink>
</template>
