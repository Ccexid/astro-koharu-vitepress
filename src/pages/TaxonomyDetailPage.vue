<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import PageHeading from '../components/PageHeading.vue'
import PostFeed from '../components/PostFeed.vue'
import { getCategory, getTag, listPostsByCategory, listPostsByTag } from '../services/posts'
import type { Post, TaxonomyItem } from '../types/post'

const props = defineProps<{ kind: 'category' | 'tag'; slug: string }>()
const item = ref<TaxonomyItem | null>(null)
const posts = ref<Post[]>([])
const loading = ref(true)
const error = ref(false)
const isCategory = computed(() => props.kind === 'category')
const root = computed(() => (isCategory.value ? 'categories' : 'tags'))

async function load() {
  loading.value = true
  error.value = false
  try {
    ;[item.value, posts.value] = await Promise.all(
      isCategory.value
        ? [getCategory(props.slug), listPostsByCategory(props.slug)]
        : [getTag(props.slug), listPostsByTag(props.slug)],
    )
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
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
        ><ArrowLeft :size="15" aria-hidden="true" /> 返回{{
          isCategory ? '分类' : '标签'
        }}列表</RouterLink
      >
    </p>
  </template>
</template>
