<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { articleTransitionReady } from '@/composables/usePostTransition'
import { RouterLink } from 'vue-router'
import { ChevronRight, FileText, Tag } from 'lucide-vue-next'
import PostPagination from '@/components/post/PostPagination.vue'
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
const wordCount = computed(
  () =>
    post.value?.sections.reduce(
      (total, section) =>
        total +
        section.title.length +
        section.paragraphs.join('').length +
        (section.quote?.length || 0) +
        (section.list?.join('').length || 0),
      0,
    ) || 0,
)
let request = 0
usePageCover(() =>
  post.value
    ? {
        kind: 'article',
        title: post.value.title,
        metadata: [
          '发布于 ' + post.value.publishedAt,
          wordCount.value + ' 字',
          post.value.readingMinutes + ' 分钟阅读',
        ],
        sections: post.value.sections.map((section) => ({ id: section.id, title: section.title })),
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
    <div v-if="post.sections.length" class="article-body">
      <section v-for="section in post.sections" :id="section.id" :key="section.id">
        <h2>
          {{ section.title
          }}<a :href="'#' + section.id" class="heading-anchor" :aria-label="'链接到 ' + section.title">#</a>
        </h2>
        <p v-for="(paragraph, index) in section.paragraphs" :key="index">{{ paragraph }}</p>
        <blockquote v-if="section.quote">{{ section.quote }}</blockquote>
        <ul v-if="section.list">
          <li v-for="item in section.list" :key="item">{{ item }}</li>
        </ul>
      </section>
    </div>
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
