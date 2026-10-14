<script setup lang="ts">
import type { BangumiFollowStatus } from '@/api/bilibili'
import type { BangumiCategoryFilter } from '@/services/bangumi'

defineProps<{
  category: BangumiCategoryFilter
  followStatus: BangumiFollowStatus
}>()

const emit = defineEmits<{
  'update:category': [category: BangumiCategoryFilter]
  'update:followStatus': [status: BangumiFollowStatus]
}>()

const statuses: { value: BangumiFollowStatus; label: string }[] = [
  { value: 2, label: '在看' },
  { value: 1, label: '想看' },
  { value: 3, label: '看过' },
]

const categories: { value: BangumiCategoryFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 1, label: '番剧' },
  { value: 2, label: '影视' },
]
</script>

<template>
  <div class="bangumi-filters">
    <div class="bangumi-categories" role="group" aria-label="按类型筛选">
      <button
        v-for="item in categories"
        :key="item.value"
        type="button"
        class="bangumi-category"
        :class="{ 'is-active': category === item.value }"
        :aria-pressed="category === item.value"
        @click="emit('update:category', item.value)"
      >
        {{ item.label }}
      </button>
    </div>
    <div class="bangumi-statuses" role="group" aria-label="追番状态">
      <button
        v-for="item in statuses"
        :key="item.value"
        type="button"
        class="bangumi-status"
        :class="{ 'is-active': followStatus === item.value }"
        :aria-pressed="followStatus === item.value"
        @click="emit('update:followStatus', item.value)"
      >
        {{ item.label }}
      </button>
    </div>
  </div>
</template>
