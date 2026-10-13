<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowUpRight } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import PageHeading from '../components/PageHeading.vue'
import { listCategories, listTags } from '../services/posts'
import type { TaxonomyItem } from '../types/post'

const props = defineProps<{ kind: 'category' | 'tag' }>()
const items = ref<TaxonomyItem[]>([])
const loading = ref(true)
const error = ref(false)
const isCategory = computed(() => props.kind === 'category')
const root = computed(() => (isCategory.value ? 'categories' : 'tags'))

async function load() {
  loading.value = true
  error.value = false
  try {
    items.value = await (isCategory.value ? listCategories() : listTags())
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
    :title="isCategory ? '文章分类' : '文章标签'"
    :eyebrow="isCategory ? 'CATEGORIES' : 'TAGS'"
    :description="
      isCategory ? '循着话题，找到感兴趣的故事。' : '从一个词出发，遇见更多相近的念头。'
    "
  />
  <p v-if="loading" class="status-message" role="status">正在加载...</p>
  <div v-else-if="error" class="status-message" role="alert">
    内容暂时无法加载。<button type="button" @click="load">重试</button>
  </div>
  <div v-else-if="items.length" class="taxonomy-grid">
    <RouterLink
      v-for="item in items"
      :key="item.slug"
      class="taxonomy-item"
      :to="`/${root}/${item.slug}`"
    >
      <span class="taxonomy-icon" aria-hidden="true">{{ isCategory ? '✿' : '#' }}</span>
      <span class="taxonomy-name">{{ item.name }}</span>
      <span class="taxonomy-count">{{ item.count }} 篇文章</span>
      <ArrowUpRight class="taxonomy-arrow" :size="18" aria-hidden="true" />
    </RouterLink>
  </div>
  <p v-else class="status-message">这里暂时还没有内容。</p>
</template>
