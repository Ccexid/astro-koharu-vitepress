<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PostYears from '@/components/post/PostYears.vue'
import { listArchives } from '@/services/posts'
import type { ArchiveYear } from '@/types/post'
const archives = ref<ArchiveYear[]>([])
const loading = ref(true)
const error = ref(false)
const posts = computed(() => archives.value.flatMap((year) => year.months.flatMap((month) => month.posts)))
const peak = computed(() =>
  Math.max(1, ...archives.value.flatMap((year) => year.months.map((month) => month.posts.length))),
)
const now = new Date()
const thisMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0')
function monthKey(year: number, month: number) {
  return year + '-' + String(month).padStart(2, '0')
}
function count(year: ArchiveYear, month: number) {
  return year.months.find((group) => group.month === month)?.posts.length || 0
}
function tier(year: ArchiveYear, month: number) {
  const n = count(year, month)
  return monthKey(year.year, month) > thisMonth
    ? 'future'
    : n
      ? String(Math.max(1, Math.ceil((n / peak.value) * 4)))
      : '0'
}
async function load() {
  loading.value = true
  error.value = false
  try {
    archives.value = await listArchives()
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>
<template>
  <p v-if="loading" class="status-message" role="status">正在加载归档…</p>
  <div v-else-if="error" class="status-message" role="alert">
    归档暂时无法加载。<button type="button" @click="load">重试</button>
  </div>
  <template v-else-if="archives.length">
    <div class="index-intro">
      <p>
        <strong>{{ posts.length }}</strong> 篇文章 <span class="intro-dot">·</span
        ><strong>{{ archives.at(-1)?.year }}–{{ archives[0]?.year }}</strong> 年
      </p>
    </div>
    <section class="archive-calendar" aria-labelledby="calendar-title">
      <div class="calendar-heading">
        <h2 id="calendar-title">写作日历</h2>
        <div class="calendar-legend" aria-hidden="true">
          少 <i v-for="n in 5" :key="n" :data-tier="n - 1"></i> 多
        </div>
      </div>
      <div class="calendar-grid">
        <div class="calendar-row month-labels" aria-hidden="true">
          <span></span><span v-for="month in 12" :key="month">{{ month }}</span>
        </div>
        <div v-for="year in archives" :key="year.year" class="calendar-row">
          <a class="calendar-year" :href="'#year-' + year.year" :aria-label="'跳到 ' + year.year + ' 年'">{{
            year.year
          }}</a
          ><template v-for="month in 12" :key="month"
            ><a
              v-if="count(year, month)"
              class="calendar-cell"
              :data-tier="tier(year, month)"
              :href="'#month-' + monthKey(year.year, month)"
              :aria-label="year.year + '年' + month + '月，' + count(year, month) + '篇文章'"
              :title="year.year + '年' + month + '月：' + count(year, month) + '篇文章'"
            ></a
            ><span
              v-else
              class="calendar-cell"
              :data-tier="tier(year, month)"
              :title="year.year + '年' + month + '月，暂无文章'"
            ></span
          ></template>
        </div>
      </div>
    </section>
    <PostYears :posts="posts" anchors />
  </template>
  <p v-else class="status-message" role="status">这里暂时还没有归档。</p>
</template>
