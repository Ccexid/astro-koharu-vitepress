<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ArrowLeft, ArrowRight, CalendarDays, Clock3 } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { getPost, listPosts } from '@/services/posts'
import type { Post } from '@/types/post'

const props = defineProps<{ slug: string }>()
const post = ref<Post | null>(null)
const allPosts = ref<Post[]>([])
const loading = ref(true)
const error = ref(false)
const postIndex = computed(() => allPosts.value.findIndex((item) => item.slug === props.slug))
const previousPost = computed(() => allPosts.value[postIndex.value + 1] ?? null)
const nextPost = computed(() => allPosts.value[postIndex.value - 1] ?? null)

async function loadPost(slug: string) {
  loading.value = true
  error.value = false
  post.value = null
  try {
    ;[post.value, allPosts.value] = await Promise.all([getPost(slug), listPosts()])
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => loadPost(props.slug))
watch(
  () => props.slug,
  (slug) => loadPost(slug),
)
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
      <span>/</span><span>{{ post.title }}</span>
    </nav>
    <div class="article-intro">
      <RouterLink class="article-category" :to="`/categories/${post.category.slug}`">{{
        post.category.name
      }}</RouterLink>
      <h1>{{ post.title }}</h1>
      <p class="article-deck">{{ post.excerpt }}</p>
      <div class="article-meta">
        <span>
          <CalendarDays :size="16" aria-hidden="true" /><time :datetime="post.publishedAt">{{
            post.publishedAt
          }}</time>
        </span>
        <span> <Clock3 :size="16" aria-hidden="true" />{{ post.readingMinutes }} 分钟阅读 </span>
      </div>
    </div>

    <figure class="article-cover">
      <img :src="post.cover" :alt="post.coverAlt" />
      <figcaption>{{ post.coverAlt }}</figcaption>
    </figure>

    <div class="article-layout">
      <div class="article-body">
        <section v-for="section in post.sections" :id="section.id" :key="section.id">
          <h2>{{ section.title }}</h2>
          <p v-for="(paragraph, index) in section.paragraphs" :key="index">{{ paragraph }}</p>
          <blockquote v-if="section.quote">{{ section.quote }}</blockquote>
          <ul v-if="section.list">
            <li v-for="item in section.list" :key="item">{{ item }}</li>
          </ul>
        </section>
      </div>
      <nav v-if="post.sections.length" class="article-toc" aria-label="文章目录">
        <p>本文目录</p>
        <a v-for="section in post.sections" :key="section.id" :href="`#${section.id}`">{{ section.title }}</a>
      </nav>
    </div>

    <div class="article-tags">
      <span>标签</span>
      <RouterLink v-for="tag in post.tags" :key="tag.slug" :to="`/tags/${tag.slug}`"
        ># {{ tag.name }}</RouterLink
      >
    </div>

    <nav class="article-neighbors" aria-label="前后文章">
      <RouterLink v-if="previousPost" :to="`/posts/${previousPost.slug}`">
        <span> <ArrowLeft :size="15" aria-hidden="true" /> 上一篇 </span
        ><strong>{{ previousPost.title }}</strong>
      </RouterLink>
      <span v-else></span>
      <RouterLink v-if="nextPost" :to="`/posts/${nextPost.slug}`">
        <span>下一篇 <ArrowRight :size="15" aria-hidden="true" /> </span><strong>{{ nextPost.title }}</strong>
      </RouterLink>
    </nav>
  </article>
</template>
