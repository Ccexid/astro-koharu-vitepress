<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import PageHeading from '@/components/PageHeading.vue'
import { listArchives } from '@/services/posts'
import type { ArchiveYear } from '@/types/post'

const archives = ref<ArchiveYear[]>([])
const loading = ref(true)
const error = ref(false)

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

const totalPosts = computed(() => archives.value.reduce((total, year) => total + countYear(year), 0))

function countYear(year: ArchiveYear): number {
  return year.months.reduce((total, month) => total + month.posts.length, 0)
}
</script>

<template>
  <PageHeading title="沿年月回看" eyebrow="ARCHIVE INDEX" description="沿着时间的线，找回那些写过的日子。" />
  <p v-if="loading" class="status-message" role="status">正在加载归档...</p>
  <div v-else-if="error" class="status-message" role="alert">
    归档暂时无法加载。<button type="button" @click="load">重试</button>
  </div>
  <div v-else-if="archives.length" class="archive-list">
    <p class="archive-summary">共 {{ totalPosts }} 篇文章，按时间由近及远排列</p>
    <section
      v-for="year in archives"
      :key="year.year"
      class="archive-year"
      :aria-labelledby="`archive-year-${year.year}`"
    >
      <header class="archive-year-heading">
        <h2 :id="`archive-year-${year.year}`">{{ year.year }}<span>年</span></h2>
        <p>{{ countYear(year) }} 篇</p>
      </header>
      <section
        v-for="group in year.months"
        :key="group.month"
        class="archive-month"
        :aria-labelledby="`archive-month-${year.year}-${group.month}`"
      >
        <h3 :id="`archive-month-${year.year}-${group.month}`">
          <span>{{ String(group.month).padStart(2, '0') }}月</span>
          <small>{{ group.posts.length }} 篇</small>
        </h3>
        <ul>
          <li v-for="post in group.posts" :key="post.id">
            <time class="archive-date" :datetime="post.publishedAt">
              {{ post.publishedAt.slice(8, 10) }}日
            </time>
            <RouterLink class="archive-post-link" :to="`/posts/${post.slug}`">
              {{ post.title }}
            </RouterLink>
            <RouterLink class="archive-category" :to="`/categories/${post.category.slug}`">
              {{ post.category.name }}
            </RouterLink>
          </li>
        </ul>
      </section>
    </section>
  </div>
  <p v-else class="status-message" role="status">这里暂时还没有归档。</p>
</template>
