<script setup lang="ts">
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink, RefreshCw } from 'lucide-vue-next'
import { onBeforeUnmount, ref, watch } from 'vue'
import PageHeading from '@/components/PageHeading.vue'
import {
  BANGUMI_PAGE_SIZE,
  listBangumiPage,
  type BangumiCategoryFilter,
  type BangumiPage,
} from '@/services/bangumi'
import type { BangumiFollowStatus } from '@/api/bilibili'

const vmid = import.meta.env.VITE_API_BILIBILI_UID
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

const followStatus = ref<BangumiFollowStatus>(2)
const category = ref<BangumiCategoryFilter>('all')
const currentPage = ref(1)
const result = ref<BangumiPage>()
const isLoading = ref(true)
const errorMessage = ref('')

let activeController: AbortController | undefined
let requestId = 0

async function loadPage(): Promise<void> {
  activeController?.abort()
  const controller = new AbortController()
  activeController = controller
  const currentRequest = ++requestId
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await listBangumiPage(
      {
        vmid,
        followStatus: followStatus.value,
        category: category.value,
        page: currentPage.value,
        pageSize: BANGUMI_PAGE_SIZE,
      },
      { signal: controller.signal },
    )

    if (currentRequest !== requestId) return
    if (response.totalPages > 0 && currentPage.value > response.totalPages) {
      currentPage.value = response.totalPages
      return
    }
    result.value = response
  } catch (error) {
    if (controller.signal.aborted || currentRequest !== requestId) return
    errorMessage.value = getErrorMessage(error)
  } finally {
    if (currentRequest === requestId) isLoading.value = false
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.includes('HTTP 403')) {
    return 'Bilibili 拒绝了这次请求，请检查代理设置或稍后重试。'
  }
  if (error instanceof Error && error.message) return error.message
  return '追番列表暂时无法读取，请稍后重试。'
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function statusLabel(status: BangumiFollowStatus): string {
  return statuses.find((item) => item.value === status)?.label ?? ''
}

watch(
  [followStatus, category, currentPage],
  ([nextStatus, nextCategory, nextPage], [previousStatus, previousCategory]) => {
    if ((nextStatus !== previousStatus || nextCategory !== previousCategory) && nextPage !== 1) {
      currentPage.value = 1
      return
    }
    void loadPage()
  },
  { immediate: true },
)

onBeforeUnmount(() => activeController?.abort())
</script>

<template>
  <PageHeading title="追番记录" eyebrow="BANGUMI" description="把想看的故事收好，也记下正在追的每一集。" />

  <section class="bangumi-page" aria-label="追番列表" :aria-busy="isLoading">
    <div class="bangumi-filters">
      <div class="bangumi-categories" role="group" aria-label="按类型筛选">
        <button
          v-for="item in categories"
          :key="item.value"
          type="button"
          class="bangumi-category"
          :class="{ 'is-active': category === item.value }"
          :aria-pressed="category === item.value"
          @click="category = item.value"
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
          @click="followStatus = item.value"
        >
          {{ item.label }}
        </button>
      </div>
    </div>

    <div class="bangumi-results-line" aria-live="polite">
      <span v-if="result && !errorMessage">共 {{ result.total }} 部</span>
      <span v-else>&nbsp;</span>
      <span>每页 {{ BANGUMI_PAGE_SIZE }} 部</span>
    </div>

    <div v-if="isLoading" class="bangumi-state" role="status">
      <span class="bangumi-spinner" aria-hidden="true"></span>
      <span>正在读取追番列表…</span>
    </div>

    <div v-else-if="errorMessage" class="bangumi-state bangumi-state-error" role="alert">
      <p>{{ errorMessage }}</p>
      <button type="button" class="bangumi-retry" @click="loadPage">
        <RefreshCw :size="15" aria-hidden="true" />
        <span>重试</span>
      </button>
    </div>

    <div v-else-if="!result?.list.length" class="bangumi-state" role="status">当前筛选下还没有条目。</div>

    <template v-else>
      <ul class="bangumi-list">
        <li
          v-for="(item, index) in result.list"
          :key="item.id"
          class="bangumi-item"
          :data-cover-side="index % 2 === 0 ? 'left' : 'right'"
        >
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
              <span class="bangumi-status-badge">{{ statusLabel(item.status) }}</span>
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
      </ul>

      <nav v-if="result.totalPages > 1" class="bangumi-pagination" aria-label="追番列表分页">
        <button
          type="button"
          class="bangumi-page-button"
          :disabled="currentPage <= 1 || isLoading"
          aria-label="上一页"
          @click="currentPage--"
        >
          <ChevronLeft :size="17" aria-hidden="true" />
          <span>上一页</span>
        </button>
        <span class="bangumi-page-info">{{ currentPage }} / {{ result.totalPages }}</span>
        <button
          type="button"
          class="bangumi-page-button"
          :disabled="currentPage >= result.totalPages || isLoading"
          aria-label="下一页"
          @click="currentPage++"
        >
          <span>下一页</span>
          <ChevronRight :size="17" aria-hidden="true" />
        </button>
      </nav>
    </template>
  </section>
</template>
