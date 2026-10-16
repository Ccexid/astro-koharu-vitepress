<script setup lang="ts">
import { computed } from 'vue'
import type { ArticleDraft } from '@/types/article'
import { articleHeadings, articleStats, safeArticleUrl } from '@/services/article-content'
import ArticleRenderer from '@/components/article/ArticleRenderer.vue'
import ArticleImage from '@/components/article/ArticleImage.vue'
const props = defineProps<{ draft: ArticleDraft }>()
const stats = computed(() => articleStats(props.draft.content))
const headings = computed(() => articleHeadings(props.draft.content))
const cover = computed(() => safeArticleUrl(props.draft.cover, true))
</script>
<template>
  <article class="editor-preview" aria-label="文章真实预览">
    <header>
      <p class="editor-local-label">本地预览 · 尚未线上发布</p>
      <h1>{{ draft.title || '未命名文章' }}</h1>
      <p class="editor-preview-meta">
        {{ draft.publishedAt }} · {{ draft.category.name }} · {{ stats.wordCount }} 字 ·
        {{ stats.readingMinutes }} 分钟阅读
      </p>
      <p v-if="draft.excerpt">{{ draft.excerpt }}</p>
    </header>
    <ArticleImage v-if="cover" :src="cover" :alt="draft.coverAlt" />
    <details v-if="headings.length" class="preview-toc">
      <summary>文章目录</summary>
      <nav aria-label="预览目录">
        <a
          v-for="heading in headings"
          :key="heading.id"
          :href="'#' + heading.id"
          :style="{ paddingInlineStart: (heading.level - 2) * 16 + 'px' }"
          >{{ heading.title }}</a
        >
      </nav>
    </details>
    <ArticleRenderer :content="draft.content" />
    <p v-if="!stats.wordCount" class="status-message">还没有正文，切换到编辑开始写作。</p>
    <div class="article-tags">
      <span v-for="tag in draft.tags" :key="tag.slug">{{ tag.name }}</span>
    </div>
  </article>
</template>
