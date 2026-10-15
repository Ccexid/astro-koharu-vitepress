<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowRight, CalendarDays, Clock3, List, MapPin } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import PostPagination from '@/components/post/PostPagination.vue'
import { getPost, listPosts } from '@/services/posts'
import type { Post } from '@/types/post'

const props = defineProps<{ slug: string }>()
const post = ref<Post | null>(null)
const allPosts = ref<Post[]>([])
const loading = ref(true)
const error = ref(false)
const postIndex = computed(() => allPosts.value.findIndex((item) => item.slug === props.slug))
const previousPost = computed(() =>
  postIndex.value >= 0 ? (allPosts.value[postIndex.value + 1] ?? null) : null,
)
const nextPost = computed(() => (postIndex.value >= 0 ? (allPosts.value[postIndex.value - 1] ?? null) : null))
const publishedDateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
})
let latestRequest = 0

function formatPublishedDate(value: string): string {
  return publishedDateFormatter.format(new Date(`${value}T00:00:00Z`))
}

async function loadPost(slug: string) {
  const requestId = ++latestRequest
  loading.value = true
  error.value = false
  post.value = null
  allPosts.value = []
  try {
    const [resultPost, resultPosts] = await Promise.all([getPost(slug), listPosts()])
    if (requestId !== latestRequest) return
    post.value = resultPost
    allPosts.value = resultPosts
  } catch {
    if (requestId !== latestRequest) return
    error.value = true
  } finally {
    if (requestId === latestRequest) loading.value = false
  }
}

watch(() => props.slug, loadPost, { immediate: true, flush: 'sync' })
</script>

<template>
  <p v-if="loading" class="status-message" role="status">正在加载文章...</p>
  <div v-else-if="error" class="status-message" role="alert">
    文章暂时无法加载。<button type="button" @click="loadPost(slug)">重试</button>
  </div>
  <div v-else-if="!post" class="empty-page">
    <p class="empty-symbol">404</p>
    <h1>这篇文章还不存在</h1>
    <p>检查链接，或回到文章列表继续阅读。</p>
    <RouterLink to="/posts"
      >浏览文章
      <ArrowRight :size="16" aria-hidden="true" />
    </RouterLink>
  </div>
  <article v-else class="article-page">
    <nav class="article-breadcrumb" aria-label="当前位置">
      <RouterLink to="/">首页</RouterLink><span>/</span>
      <RouterLink to="/posts">文章</RouterLink>
      <span>/</span><span aria-current="page">{{ post.title }}</span>
    </nav>
    <div class="article-intro">
      <RouterLink class="article-category" :to="`/categories/${post.category.slug}`">{{
        post.category.name
      }}</RouterLink>
      <span v-if="post.pinned" class="article-pinned"><MapPin :size="13" aria-hidden="true" /> 置顶</span>
      <h1>{{ post.title }}</h1>
      <p class="article-deck">{{ post.excerpt }}</p>
      <div class="article-meta">
        <span>
          <CalendarDays :size="15" aria-hidden="true" />
          <time :datetime="post.publishedAt">{{ formatPublishedDate(post.publishedAt) }}</time>
        </span>
        <span><Clock3 :size="15" aria-hidden="true" />{{ post.readingMinutes }} 分钟阅读</span>
      </div>
    </div>

    <figure class="article-cover">
      <img :src="post.cover" alt="" />
      <figcaption>{{ post.coverAlt }}</figcaption>
    </figure>

    <div class="article-layout">
      <nav v-if="post.sections.length" class="article-toc" aria-label="文章目录">
        <p><List :size="15" aria-hidden="true" /> 目录</p>
        <a v-for="section in post.sections" :key="section.id" :href="`#${section.id}`">{{ section.title }}</a>
      </nav>
      <div v-if="post.sections.length" class="article-body">
        <section v-for="section in post.sections" :id="section.id" :key="section.id">
          <h2>{{ section.title }}</h2>
          <p v-for="(paragraph, index) in section.paragraphs" :key="index">{{ paragraph }}</p>
          <blockquote v-if="section.quote">{{ section.quote }}</blockquote>
          <ul v-if="section.list">
            <li v-for="item in section.list" :key="item">{{ item }}</li>
          </ul>
        </section>
      </div>
      <p v-else class="article-empty-body" role="status">正文内容暂未整理。</p>
    </div>

    <div v-if="post.tags.length" class="article-tags">
      <span>标签</span>
      <RouterLink v-for="tag in post.tags" :key="tag.slug" :to="`/tags/${tag.slug}`"
        ># {{ tag.name }}</RouterLink
      >
    </div>

    <PostPagination :previous-post="previousPost" :next-post="nextPost" />
  </article>
</template>
