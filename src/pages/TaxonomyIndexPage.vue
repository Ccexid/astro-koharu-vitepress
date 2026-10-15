<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowUpRight, FolderOpen, Hash } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import PageHeading from '@/components/PageHeading.vue'
import { listCategories, listTags } from '@/services/posts'
import type { TaxonomyItem } from '@/types/post'

const props = defineProps<{ kind: 'category' | 'tag' }>()
const items = ref<TaxonomyItem[]>([])
const loading = ref(true)
const error = ref(false)
const isCategory = computed(() => props.kind === 'category')
const root = computed(() => (isCategory.value ? 'categories' : 'tags'))

async function load() {
  const requestId = ++latestRequest
  const kind = props.kind
  loading.value = true
  error.value = false
  items.value = []
  try {
    const result = await (kind === 'category' ? listCategories() : listTags())
    if (requestId !== latestRequest) return
    items.value = result
  } catch {
    if (requestId !== latestRequest) return
    error.value = true
  } finally {
    if (requestId === latestRequest) loading.value = false
  }
}

let latestRequest = 0
watch(() => props.kind, load, { immediate: true })
</script>

<template>
  <PageHeading
    :title="isCategory ? '按主题浏览' : '按标签浏览'"
    :eyebrow="isCategory ? 'CATEGORY INDEX' : 'TAG INDEX'"
    :description="isCategory ? '循着话题，找到感兴趣的故事。' : '从一个词出发，遇见更多相近的念头。'"
  />
  <p v-if="loading" class="status-message" role="status">正在加载...</p>
  <div v-else-if="error" class="status-message" role="alert">
    内容暂时无法加载。<button type="button" @click="load">重试</button>
  </div>
  <div v-else-if="items.length" class="taxonomy-index">
    <p class="taxonomy-summary">
      <strong>{{ items.length }}</strong>
      {{ isCategory ? '个分类' : '个标签' }}
      <span>按名称排列</span>
    </p>
    <ul class="taxonomy-grid">
      <li v-for="item in items" :key="item.slug" class="taxonomy-index-item">
        <RouterLink class="taxonomy-item" :to="`/${root}/${item.slug}`">
          <span class="taxonomy-icon" aria-hidden="true">
            <FolderOpen v-if="isCategory" :size="17" />
            <Hash v-else :size="17" />
          </span>
          <span class="taxonomy-name">{{ item.name }}</span>
          <span class="taxonomy-count">
            <strong>{{ item.count }}</strong>
            <small>篇文章</small>
          </span>
          <ArrowUpRight class="taxonomy-arrow" :size="17" aria-hidden="true" />
        </RouterLink>
      </li>
    </ul>
  </div>
  <p v-else class="status-message" role="status">这里暂时还没有内容。</p>
</template>
