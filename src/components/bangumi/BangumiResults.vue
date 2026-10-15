<script setup lang="ts">
import { ref, toRef } from 'vue'
import InfiniteLoadMore from '@/components/InfiniteLoadMore.vue'
import BangumiItem from './BangumiItem.vue'
import { useMasonry } from '@/composables/useMasonry'
import type { CollectionItem } from '@/types/bangumi'
const props = defineProps<{
  items: CollectionItem[]
  total: number
  loading: boolean
  loadingMore: boolean
  error: string
  moreError: string
  hasMore: boolean
  showStatus: boolean
}>()
defineEmits<{ retry: []; loadMore: [] }>()
const shelf = ref<HTMLElement | null>(null)
useMasonry(shelf, toRef(props, 'items'))
</script>
<template>
  <div v-if="loading" class="bangumi-skeleton" role="status" aria-label="正在读取收藏">
    <div v-for="index in 8" :key="index" class="skeleton-poster" aria-hidden="true"></div>
  </div>
  <div v-else-if="error" class="status-message" role="alert">
    {{ error }}<button type="button" @click="$emit('retry')">重试</button>
  </div>
  <template v-else>
    <p class="collection-count" aria-live="polite">已加载 {{ items.length }} / {{ total }} 部作品</p>
    <div v-if="items.length" ref="shelf" class="bangumi-masonry">
      <BangumiItem v-for="item in items" :key="item.id" :item="item" :show-status="showStatus" />
    </div>
    <p v-else class="empty-collection" role="status">这个分类暂时没有公开收藏。试试其他媒介或状态吧。</p>
    <InfiniteLoadMore
      v-if="items.length"
      :has-more="hasMore"
      :is-loading="loadingMore"
      :error-message="moreError"
      complete-text="已经看到最后一部了"
      @load-more="$emit('loadMore')"
      @retry="$emit('loadMore')"
    />
  </template>
</template>
