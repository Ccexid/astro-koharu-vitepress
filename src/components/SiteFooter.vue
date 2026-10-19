<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Clock3, FileText, Flower2, BookOpen } from 'lucide-vue-next'
import PostRecommendations from '@/components/post/PostRecommendations.vue'
import { listPosts } from '@/services/posts'
import type { Post } from '@/types/post'
import { siteConfig } from '@/config/site'
defineProps<{ pageKey: string; articleSlug?: string; showRecommendations: boolean }>()
const posts = ref<Post[]>([])
const currentYear = new Date().getFullYear()
onMounted(async () => {
  try {
    posts.value = await listPosts()
  } catch {
    posts.value = []
  }
})
const minutes = computed(() => posts.value.reduce((sum, post) => sum + post.readingMinutes, 0))
</script>
<template>
  <PostRecommendations v-if="showRecommendations" :page-key="pageKey" :article-slug="articleSlug" />
  <footer class="site-footer">
    <div class="footer-stats">
      <span><FileText :size="14" />{{ posts.length }} 篇</span
      ><span><Clock3 :size="14" />{{ minutes }} 分钟</span
      ><RouterLink :to="siteConfig.navigation.articles.items[0].to"
        ><BookOpen :size="14" />{{ siteConfig.navigation.articles.items[0].label }}</RouterLink
      >
      <RouterLink to="/editor">本地写作</RouterLink>
    </div>
    <p>
      © {{ siteConfig.copyrightSince }}–{{ currentYear }} <Flower2 :size="16" aria-hidden="true" />
      {{ siteConfig.author }} @{{ siteConfig.name }}
    </p>
    <p class="footer-credit">
      Vue 模板 · 视觉参考
      <a href="https://github.com/cosZone/astro-koharu" target="_blank" rel="noopener noreferrer"
        >astro-koharu v7.7.4</a
      >
    </p>
  </footer>
</template>
