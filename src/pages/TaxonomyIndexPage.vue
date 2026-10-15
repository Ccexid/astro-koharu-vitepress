<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import CategoryTree from '@/components/CategoryTree.vue'
import { listCategories, listCategoryTree, listPosts, listTags } from '@/services/posts'
import type { TaxonomyItem } from '@/types/post'
const props = defineProps<{ kind: 'category' | 'tag' }>()
const items = ref<TaxonomyItem[]>([])
const categories = ref<TaxonomyItem[]>([])
const loading = ref(true)
const error = ref(false)
const postCount = ref(0)
const categoryCount = ref(0)
const query = ref('')
const singlesOpen = ref(false)
let request = 0
const isCategory = computed(() => props.kind === 'category')
const byFrequency = computed(() =>
  [...items.value].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN')),
)
const filteredTags = computed(() =>
  byFrequency.value.filter((tag) =>
    tag.name.toLocaleLowerCase().includes(query.value.trim().toLocaleLowerCase()),
  ),
)
const frequent = computed(() => filteredTags.value.filter((tag) => tag.count > 1))
const singles = computed(() => filteredTags.value.filter((tag) => tag.count === 1))
async function load() {
  const id = ++request
  loading.value = true
  error.value = false
  query.value = ''
  singlesOpen.value = false
  try {
    const [flat, tree, posts] = await Promise.all([
      props.kind === 'category' ? listCategories() : listTags(),
      props.kind === 'category' ? listCategoryTree() : Promise.resolve([]),
      listPosts(),
    ])
    if (id !== request) return
    items.value = flat
    categories.value = tree
    postCount.value = posts.length
    categoryCount.value = flat.length
  } catch {
    if (id === request) error.value = true
  } finally {
    if (id === request) loading.value = false
  }
}
watch(() => props.kind, load, { immediate: true })
</script>
<template>
  <p v-if="loading" class="status-message" role="status">正在加载…</p>
  <div v-else-if="error" class="status-message" role="alert">
    内容暂时无法加载。<button type="button" @click="load">重试</button>
  </div>
  <template v-else-if="isCategory">
    <div class="index-intro">
      <p>
        <strong>{{ categoryCount }}</strong> 个分类 <span class="intro-dot">·</span
        ><strong>{{ postCount }}</strong> 篇文章
      </p>
    </div>
    <CategoryTree v-if="categories.length" :items="categories" />
    <p v-else class="status-message" role="status">这里暂时没有分类。</p>
  </template>
  <template v-else>
    <div class="index-intro">
      <p>
        <strong>{{ items.length }}</strong> 个标签
        <template v-if="byFrequency[0]"
          ><span class="intro-dot">·</span>最常用 <strong>{{ byFrequency[0].name }}</strong></template
        >
      </p>
      <label class="tag-filter"
        ><span class="sr-only">过滤标签</span><input v-model="query" type="search" placeholder="输入标签名称"
      /></label>
    </div>
    <div class="tag-cloud">
      <RouterLink
        v-for="tag in frequent"
        :key="tag.slug"
        :to="'/tags/' + tag.slug"
        :class="{ 'tag-prominent': tag.count >= 3 }"
        >{{ tag.name }}<sup>{{ tag.count }}</sup></RouterLink
      >
    </div>
    <details v-if="singles.length" :open="singlesOpen || !!query" class="single-tags">
      <summary>还有 {{ singles.length }} 个只出现过一次的标签</summary>
      <div class="tag-cloud">
        <RouterLink v-for="tag in singles" :key="tag.slug" :to="'/tags/' + tag.slug"
          >{{ tag.name }}<sup>1</sup></RouterLink
        >
      </div>
    </details>
    <p v-if="!filteredTags.length" class="status-message" role="status">
      {{ query ? '没有匹配的标签，请换个关键词。' : '这里暂时没有标签。' }}
    </p>
  </template>
</template>
