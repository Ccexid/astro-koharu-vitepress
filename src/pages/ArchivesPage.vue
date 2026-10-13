<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import PageHeading from '../components/PageHeading.vue'
import { listArchives } from '../services/posts'
import type { ArchiveYear } from '../types/post'

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
</script>

<template>
  <PageHeading
    title="时光归档"
    eyebrow="ARCHIVES"
    description="沿着时间的线，找回那些写过的日子。"
  />
  <p v-if="loading" class="status-message" role="status">正在加载归档...</p>
  <div v-else-if="error" class="status-message" role="alert">
    归档暂时无法加载。<button type="button" @click="load">重试</button>
  </div>
  <div v-else-if="archives.length" class="archive-list">
    <section v-for="year in archives" :key="year.year" class="archive-year">
      <h2>{{ year.year }} <span>YEAR</span></h2>
      <div v-for="group in year.months" :key="group.month" class="archive-month">
        <h3>{{ String(group.month).padStart(2, '0') }}月</h3>
        <ul>
          <li v-for="post in group.posts" :key="post.id">
            <time :datetime="post.publishedAt">{{
              post.publishedAt.slice(5).replace('-', '.')
            }}</time>
            <RouterLink :to="`/posts/${post.slug}`">{{ post.title }}</RouterLink>
            <span>{{ post.category.name }}</span>
          </li>
        </ul>
      </div>
    </section>
  </div>
  <p v-else class="status-message">这里暂时还没有归档。</p>
</template>
