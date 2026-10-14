<script setup lang="ts">
import { RefreshCw } from 'lucide-vue-next'
import type { BangumiPage } from '@/services/bangumi'
import BangumiItem from './BangumiItem.vue'

defineProps<{
  result?: BangumiPage
  isLoading: boolean
  errorMessage: string
  pageSize: number
}>()

defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="bangumi-results-line" aria-live="polite">
    <span v-if="result && !errorMessage">共 {{ result.total }} 部</span>
    <span v-else>&nbsp;</span>
    <span>每页 {{ pageSize }} 部</span>
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
  <div v-else-if="!result?.list.length" class="bangumi-state" role="status">当前筛选下还没有条目。</div>
  <ul v-else class="bangumi-list">
    <BangumiItem
      v-for="(item, index) in result.list"
      :key="item.id"
      :item="item"
      :cover-side="index % 2 === 0 ? 'left' : 'right'"
    />
  </ul>
</template>
