<script setup lang="ts">
import BangumiFilters from '@/components/bangumi/BangumiFilters.vue'
import BangumiResults from '@/components/bangumi/BangumiResults.vue'
import { useBangumiCollection } from '@/composables/useBangumiCollection'
const userId = String(import.meta.env.VITE_BANGUMI_USER_ID || 'cosine')
const collection = useBangumiCollection(userId)
const {
  subjectType,
  status,
  items,
  total,
  loading,
  loadingMore,
  error,
  moreError,
  typeCounts,
  statusCounts,
  countsError,
  hasMore,
} = collection
</script>
<template>
  <section class="bangumi-page" aria-label="公开收藏" :aria-busy="loading">
    <BangumiFilters
      v-model:subject-type="subjectType"
      v-model:status="status"
      :type-counts="typeCounts"
      :status-counts="statusCounts"
    />
    <p v-if="countsError && !error" class="counts-notice" role="status">
      收藏数量暂时无法更新，仍可浏览列表。<button type="button" @click="collection.retryCounts">
        重试统计
      </button>
    </p>
    <BangumiResults
      :items="items"
      :total="total"
      :loading="loading"
      :loading-more="loadingMore"
      :error="error"
      :more-error="moreError"
      :has-more="hasMore"
      :show-status="status === 'all'"
      @retry="collection.load()"
      @load-more="collection.load(true)"
    />
    <p class="collection-source">
      公开收藏来自
      <a :href="'https://bgm.tv/user/' + encodeURIComponent(userId)" target="_blank" rel="noopener noreferrer"
        >Bangumi · {{ userId }}</a
      >
    </p>
  </section>
</template>
