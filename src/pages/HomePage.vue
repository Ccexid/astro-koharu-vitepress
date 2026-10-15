<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, Flower2 } from 'lucide-vue-next'
import PostFeed from '@/components/PostFeed.vue'
import { listCategories, listPosts } from '@/services/posts'
import type { Post, TaxonomyItem } from '@/types/post'
const posts = ref<Post[]>([])
const categories = ref<TaxonomyItem[]>([])
const loading = ref(true)
const error = ref(false)
const pinned = computed(() => posts.value.filter((post) => post.pinned))
const regular = computed(() => posts.value.filter((post) => !post.pinned))
const featured = computed(() =>
  categories.value.filter((category) => !category.slug.includes('/')).slice(0, 4),
)
async function load() {
  loading.value = true
  error.value = false
  try {
    ;[posts.value, categories.value] = await Promise.all([listPosts(), listCategories()])
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}
function cover(slug: string) {
  return posts.value.find((post) => post.category.slug === slug || post.category.slug.startsWith(slug + '/'))
    ?.cover
}
function related(slug: string) {
  return posts.value
    .filter((post) => post.category.slug === slug || post.category.slug.startsWith(slug + '/'))
    .slice(0, 3)
}
onMounted(load)
</script>
<template>
  <div class="home-page">
    <p v-if="loading" class="status-message" role="status">正在加载文章…</p>
    <div v-else-if="error" class="status-message" role="alert">
      文章暂时无法加载。<button type="button" @click="load">重试</button>
    </div>
    <template v-else>
      <template v-if="pinned.length"
        ><h2 class="section-divider">
          <Flower2 :size="18" aria-hidden="true" />置顶文章<Flower2 :size="18" aria-hidden="true" />
        </h2>
        <PostFeed :posts="pinned" :page-size="pinned.length"
      /></template>
      <div class="home-section-heading">
        <h2 class="section-divider"><Flower2 :size="18" aria-hidden="true" />文章列表</h2>
        <RouterLink to="/posts">所有文章<ArrowRight :size="14" aria-hidden="true" /></RouterLink>
      </div>
      <PostFeed :posts="regular" :page-size="4" />
      <h2 class="section-divider featured-heading"><Flower2 :size="18" aria-hidden="true" />精选分类</h2>
      <div class="featured-categories">
        <section v-for="category in featured" :key="category.slug" class="featured-category">
          <RouterLink class="featured-image" :to="'/categories/' + category.slug"
            ><img :src="cover(category.slug)" alt="" loading="lazy" />
            <h3>{{ category.name }}</h3></RouterLink
          >
          <div class="featured-copy">
            <RouterLink v-for="post in related(category.slug)" :key="post.id" :to="'/posts/' + post.slug">{{
              post.title
            }}</RouterLink
            ><RouterLink class="featured-more" :to="'/categories/' + category.slug"
              >{{ category.count }} 篇文章<ArrowRight :size="15"
            /></RouterLink>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>
