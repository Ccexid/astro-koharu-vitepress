<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { articleTransitionReady } from '@/composables/usePostTransition'
import { RouterLink } from 'vue-router'
import { ChevronRight, FileText, Tag } from 'lucide-vue-next'
import PostPagination from '@/components/post/PostPagination.vue'
import ArticleRenderer from '@/components/article/ArticleRenderer.vue'
import { articleHeadings, articleStats, postDocument } from '@/services/article-content'
import { usePageCover } from '@/composables/usePageCover'
import { getCategoryTrail, getPost, listPosts } from '@/services/posts'
import type { Post, TaxonomyItem } from '@/types/post'
const props = defineProps<{ slug: string }>()
const post = ref<Post | null>(null)
const allPosts = ref<Post[]>([])
const trail = ref<TaxonomyItem[]>([])
const loading = ref(true)
const error = ref(false)
const postIndex = computed(() => allPosts.value.findIndex((item) => item.slug === props.slug))
const previousPost = computed(() =>
  postIndex.value >= 0 ? allPosts.value[postIndex.value + 1] || null : null,
)
const nextPost = computed(() => (postIndex.value >= 0 ? allPosts.value[postIndex.value - 1] || null : null))
const content = computed(() => (post.value ? postDocument(post.value) : null))
const stats = computed(() =>
  content.value ? articleStats(content.value) : { wordCount: 0, readingMinutes: 1 },
)
const headings = computed(() => (content.value ? articleHeadings(content.value) : []))
let request = 0
usePageCover(() =>
  post.value
    ? {
        kind: 'article',
        title: post.value.title,
        metadata: [
          '发布于 ' + post.value.publishedAt,
          stats.value.wordCount + ' 字',
          stats.value.readingMinutes + ' 分钟阅读',
        ],
        sections: headings.value,
      }
    : {
        kind: loading.value ? 'article' : 'not-found',
        title: loading.value ? '正在打开文章…' : error.value ? '文章暂不可用' : '文章不存在',
      },
)
async function load(slug: string) {
  const id = ++request
  loading.value = true
  error.value = false
  post.value = null
  allPosts.value = []
  trail.value = []
  try {
    const [result, posts] = await Promise.all([getPost(slug), listPosts()])
    const path = result ? await getCategoryTrail(result.category.slug) : []
    if (id !== request) return
    post.value = result
    allPosts.value = posts
    trail.value = path
  } catch {
    if (id === request) error.value = true
  } finally {
    if (id === request) {
      loading.value = false
      await nextTick()
      articleTransitionReady(slug)
    }
  }
}
watch(() => props.slug, load, { immediate: true })
</script>
<template>
  <p v-if="loading" class="status-message" role="status">正在加载文章…</p>
  <div v-else-if="error" class="status-message" role="alert">
    文章暂时无法加载。<button type="button" @click="load(slug)">重试</button>
  </div>
  <div v-else-if="!post" class="empty-page">
    <p>检查链接，或回到列表继续阅读。</p>
    <RouterLink to="/posts">浏览文章</RouterLink>
  </div>
  <article v-else class="article-page">
    <nav class="article-breadcrumb" aria-label="当前位置">
      <RouterLink to="/">首页</RouterLink
      ><template v-for="part in trail" :key="part.slug"
        ><ChevronRight :size="14" aria-hidden="true" /><RouterLink :to="'/categories/' + part.slug">{{
          part.name
        }}</RouterLink></template
      >
    </nav>
    <details class="article-summary">
      <summary><FileText :size="15" aria-hidden="true" />文章摘要</summary>
      <p>{{ post.excerpt }}</p>
    </details>
    <div class="article-edit-link">
      <RouterLink :to="{ path: '/editor', query: { post: slug } }">在本地编辑这篇文章</RouterLink>
    </div>
    <ArticleRenderer v-if="content" :content="content" />
    <p v-else class="status-message" role="status">正文内容暂未整理。</p>
    <div v-if="post.tags.length" class="article-tags">
      <Tag :size="15" aria-hidden="true" /><RouterLink
        v-for="tag in post.tags"
        :key="tag.slug"
        :to="'/tags/' + tag.slug"
        >{{ tag.name }}</RouterLink
      >
    </div>
    <div class="article-signature">
      春日来信 <span>{{ post.publishedAt }}</span>
    </div>
    <PostPagination :previous-post="previousPost" :next-post="nextPost" />
  </article>
</template>
