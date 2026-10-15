<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import PageHeading from '@/components/PageHeading.vue'
import PostFeed from '@/components/PostFeed.vue'
import { getCategory, getTag, listPostsByCategory, listPostsByTag } from '@/services/posts'
import type { Post, TaxonomyItem } from '@/types/post'

const props = defineProps<{ kind: 'category' | 'tag'; slug: string }>()
const item = ref<TaxonomyItem | null>(null)
const posts = ref<Post[]>([])
const loading = ref(true)
const error = ref(false)
const isCategory = computed(() => props.kind === 'category')
const root = computed(() => (isCategory.value ? 'categories' : 'tags'))

async function load() {
  const requestId = ++latestRequest
  const kind = props.kind
  const slug = props.slug
  loading.value = true
  error.value = false
  item.value = null
  posts.value = []
  try {
    const [resultItem, resultPosts] = await Promise.all(
      kind === 'category'
        ? [getCategory(slug), listPostsByCategory(slug)]
        : [getTag(slug), listPostsByTag(slug)],
    )
    if (requestId !== latestRequest) return
    item.value = resultItem
    posts.value = resultPosts
  } catch {
    if (requestId !== latestRequest) return
    error.value = true
  } finally {
    if (requestId === latestRequest) loading.value = false
  }
}

let latestRequest = 0
watch(() => [props.kind, props.slug], load, { immediate: true })
</script>

<template>
  <p v-if="loading" class="status-message" role="status">正在加载...</p>
  <div v-else-if="error" class="status-message" role="alert">
    内容暂时无法加载。<button type="button" @click="load">重试</button>
  </div>
  <div v-else-if="!item" class="empty-page">
    <p class="empty-symbol">404</p>
    <h1>{{ isCategory ? '分类' : '标签' }}不存在</h1>
    <p>回到{{ isCategory ? '分类' : '标签' }}列表看看吧。</p>
    <RouterLink :to="`/${root}`"><ArrowLeft :size="16" aria-hidden="true" /> 返回列表</RouterLink>
  </div>
  <template v-else>
    <PageHeading
      :title="item.name"
      :eyebrow="isCategory ? 'CATEGORIES' : 'TAGS'"
      :description="`这里有 ${item.count} 篇关于「${item.name}」的文章。`"
    />
    <PostFeed :posts="posts" :page-size="4" />
    <p class="back-index">
      <RouterLink :to="`/${root}`"
        ><ArrowLeft :size="15" aria-hidden="true" /> 返回{{ isCategory ? '分类' : '标签' }}列表</RouterLink
      >
    </p>
  </template>
</template>
