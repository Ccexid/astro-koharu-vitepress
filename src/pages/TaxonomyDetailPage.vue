<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import PostYears from '@/components/post/PostYears.vue'
import { usePageCover } from '@/composables/usePageCover'
import {
  getCategory,
  getTag,
  getCategoryTrail,
  listCategories,
  listPostsByCategory,
  listPostsByTag,
} from '@/services/posts'
import type { Post, TaxonomyItem } from '@/types/post'
const props = defineProps<{ kind: 'category' | 'tag'; slug: string }>()
const item = ref<TaxonomyItem | null>(null)
const posts = ref<Post[]>([])
const trail = ref<TaxonomyItem[]>([])
const children = ref<TaxonomyItem[]>([])
const loading = ref(true)
const error = ref(false)
const childFilter = ref('')
const isCategory = computed(() => props.kind === 'category')
const root = computed(() => (isCategory.value ? 'categories' : 'tags'))
const visiblePosts = computed(() =>
  posts.value.filter(
    (post) =>
      !childFilter.value ||
      post.category.slug === childFilter.value ||
      post.category.slug.startsWith(childFilter.value + '/'),
  ),
)
let request = 0
usePageCover(() => ({
  kind: loading.value || item.value ? 'page' : 'not-found',
  title: loading.value
    ? '正在打开…'
    : error.value
      ? '内容暂不可用'
      : item.value
        ? isCategory.value
          ? item.value.name + ' 分类下的文章'
          : '标签「' + item.value.name + '」下的文章'
        : isCategory.value
          ? '分类不存在'
          : '标签不存在',
}))
async function load() {
  const id = ++request
  const { kind, slug } = props
  loading.value = true
  error.value = false
  item.value = null
  posts.value = []
  trail.value = []
  children.value = []
  childFilter.value = ''
  try {
    const [result, entries, path, categories] = await Promise.all([
      kind === 'category' ? getCategory(slug) : getTag(slug),
      kind === 'category' ? listPostsByCategory(slug) : listPostsByTag(slug),
      kind === 'category' ? getCategoryTrail(slug) : Promise.resolve([]),
      kind === 'category' ? listCategories() : Promise.resolve([]),
    ])
    if (id !== request) return
    item.value = result
    posts.value = entries
    trail.value = path
    children.value = categories.filter(
      (category) => category.slug.slice(0, category.slug.lastIndexOf('/')) === slug,
    )
  } catch {
    if (id === request) error.value = true
  } finally {
    if (id === request) loading.value = false
  }
}
watch(() => [props.kind, props.slug], load, { immediate: true })
</script>
<template>
  <p v-if="loading" class="status-message" role="status">正在加载文章…</p>
  <div v-else-if="error" class="status-message" role="alert">
    内容暂时无法加载。<button type="button" @click="load">重试</button>
  </div>
  <div v-else-if="!item" class="empty-page">
    <p>检查链接，或回到列表继续浏览。</p>
    <RouterLink :to="'/' + root">返回{{ isCategory ? '分类' : '标签' }}列表</RouterLink>
  </div>
  <template v-else>
    <nav class="index-breadcrumbs" aria-label="当前位置">
      <RouterLink :to="'/' + root">{{ isCategory ? '分类' : '标签' }}</RouterLink
      ><template v-if="isCategory"
        ><template v-for="(part, index) in trail" :key="part.slug"
          ><span>/</span
          ><RouterLink v-if="index < trail.length - 1" :to="'/categories/' + part.slug">{{
            part.name
          }}</RouterLink
          ><span v-else aria-current="page">{{ part.name }}</span></template
        ></template
      ><template v-else
        ><span>/</span><span aria-current="page">{{ item.name }}</span></template
      >
    </nav>
    <div class="index-intro">
      <p>
        <strong>{{ visiblePosts.length }}</strong> 篇文章
      </p>
      <div v-if="children.length" class="index-tabs quiet-tabs" role="group" aria-label="子分类筛选">
        <button type="button" :aria-pressed="!childFilter" @click="childFilter = ''">
          全部<sup>{{ posts.length }}</sup></button
        ><button
          v-for="child in children"
          :key="child.slug"
          type="button"
          :aria-pressed="childFilter === child.slug"
          @click="childFilter = child.slug"
        >
          {{ child.name }}<sup>{{ child.count }}</sup>
        </button>
      </div>
    </div>
    <PostYears :posts="visiblePosts" />
  </template>
</template>
