<script setup lang="ts">
import { RefreshCw } from 'lucide-vue-next'
import type { BangumiItem as BangumiEntry } from '@/api/bilibili'
import BangumiLoadMore from './BangumiLoadMore.vue'
import BangumiItem from './BangumiItem.vue'

defineProps<{
  items: BangumiEntry[]
  total: number
  isLoading: boolean
  isLoadingMore: boolean
  errorMessage: string
  loadMoreError: string
  hasMore: boolean
}>()

defineEmits<{
  retry: []
  'load-more': []
  'retry-load-more': []
}>()
</script>

<template>
  <div class="bangumi-results-line" aria-live="polite">
    <span v-if="!isLoading && !errorMessage">已加载 {{ items.length }} / {{ total }} 部</span>
    <span v-else>&nbsp;</span>
    <span v-if="items.length && hasMore">继续下滑加载</span>
    <span v-else>&nbsp;</span>
  </div>
  <div v-if="isLoading" class="bangumi-state" role="status">
    <span class="bangumi-spinner" aria-hidden="true"></span>
    <span>正在读取追番列表…</span>
  </div>
  <div v-else-if="errorMessage" class="bangumi-state bangumi-state-error" role="alert">
    <p>{{ errorMessage }}</p>
    <button type="button" class="bangumi-retry" @click="$emit('retry')">
      <RefreshCw :size="15" aria-hidden="true" />
      <span>重试</span>
    </button>
  </div>
  <div v-else-if="!items.length" class="bangumi-state" role="status">当前筛选下还没有条目。</div>
  <ul v-else class="bangumi-list">
    <BangumiItem
      v-for="(item, index) in items"
      :key="item.id"
      :item="item"
      :cover-side="index % 2 === 0 ? 'left' : 'right'"
    />
  </ul>

  <BangumiLoadMore
    v-if="items.length"
    :has-more="hasMore"
    :is-loading="isLoadingMore"
    :error-message="loadMoreError"
    @load-more="$emit('load-more')"
    @retry="$emit('retry-load-more')"
  />
</template>
