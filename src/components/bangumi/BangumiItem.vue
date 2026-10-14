<script setup lang="ts">
import { CalendarDays, ExternalLink } from 'lucide-vue-next'
import type { BangumiItem as BangumiEntry, BangumiFollowStatus } from '@/api/bilibili'

defineProps<{
  item: BangumiEntry
  coverSide: 'left' | 'right'
}>()

const statusLabels: Record<BangumiFollowStatus, string> = {
  1: '想看',
  2: '在看',
  3: '看过',
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}
</script>

<template>
  <li class="bangumi-item" :data-cover-side="coverSide">
    <a
      class="bangumi-cover-link"
      :href="item.url"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="`在新窗口打开：${item.title}`"
    >
      <img
        class="bangumi-cover"
        :src="item.cover"
        :alt="`${item.title} 封面`"
        loading="lazy"
        decoding="async"
        referrerpolicy="no-referrer"
      />
    </a>

    <div class="bangumi-details">
      <div class="bangumi-meta-line">
        <span class="bangumi-type-badge">{{ item.category === 2 ? '影视' : '番剧' }}</span>
        <span class="bangumi-status-badge">{{ statusLabels[item.status] }}</span>
        <time v-if="item.airDate" class="bangumi-air-date" :datetime="item.airDate">
          <CalendarDays :size="13" aria-hidden="true" />
          {{ item.airDate.replaceAll('-', '.') }}
        </time>
      </div>

      <div class="bangumi-title-line">
        <h2>
          <a :href="item.url" target="_blank" rel="noopener noreferrer">{{ item.title }}</a>
        </h2>
        <a
          class="bangumi-external-link"
          :href="item.url"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="`在新窗口打开：${item.title}`"
          :title="`打开 ${item.title}`"
        >
          <ExternalLink :size="15" aria-hidden="true" />
        </a>
      </div>

      <div class="bangumi-meta">
        <span v-if="item.type"><span class="bangumi-meta-label">类型</span>{{ item.type }}</span>
        <span v-if="item.total !== undefined"
          ><span class="bangumi-meta-label">话数</span>{{ item.total }}</span
        >
        <span v-if="item.score !== undefined" class="bangumi-score">
          <span class="bangumi-meta-label">评分</span>{{ item.score.toFixed(1) }}
        </span>
      </div>

      <p v-if="item.progress !== undefined || item.latestEpisode" class="bangumi-progress">
        <template v-if="item.progress !== undefined">看到第 {{ item.progress }} 话</template>
        <template v-else>{{ item.latestEpisode }}</template>
      </p>
      <p v-if="item.desc" class="bangumi-description">{{ item.desc }}</p>
      <div v-if="item.follow !== undefined || item.view !== undefined" class="bangumi-stats">
        <span v-if="item.follow !== undefined">追番 {{ formatCount(item.follow) }}</span>
        <span v-if="item.view !== undefined">播放 {{ formatCount(item.view) }}</span>
      </div>
    </div>

    <a
      class="bangumi-item-more"
      :href="item.url"
      target="_blank"
      rel="noopener noreferrer"
      tabindex="-1"
      aria-hidden="true"
    >
      打开条目 <ExternalLink :size="13" aria-hidden="true" />
    </a>
  </li>
</template>
