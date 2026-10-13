<script setup lang="ts">
import PostPaginationCard from '@/components/post/PostPaginationCard.vue'
import type { Post } from '@/types/post'

defineProps<{
  previousPost: Post | null
  nextPost: Post | null
}>()
</script>

<template>
  <nav v-if="previousPost || nextPost" class="post-pagination" aria-label="前后文章">
    <PostPaginationCard v-if="previousPost" :post="previousPost" direction="prev" />
    <span v-else aria-hidden="true" />
    <PostPaginationCard v-if="nextPost" :post="nextPost" direction="next" />
    <span v-else aria-hidden="true" />
  </nav>
</template>
