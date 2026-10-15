<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Clock3, FileText, Flower2, BookOpen } from 'lucide-vue-next'
import { listPosts } from '@/services/posts'
import type { Post } from '@/types/post'
const props = defineProps<{ articleSlug?: string; showRecommendations: boolean }>()
const posts = ref<Post[]>([])
onMounted(async () => {
  try {
    posts.value = await listPosts()
  } catch {
    posts.value = []
  }
})
const minutes = computed(() => posts.value.reduce((sum, post) => sum + post.readingMinutes, 0))
const recommendations = computed(() =>
  posts.value.filter((post) => post.slug !== props.articleSlug).slice(0, 6),
)
</script>
<template>
  <section
    v-if="showRecommendations && recommendations.length"
    class="footer-recommendations"
    aria-label="继续阅读"
  >
    <div v-for="(label, index) in ['再读一篇', '最近的文字']" :key="label">
      <h2 class="section-divider"><Flower2 :size="15" aria-hidden="true" />{{ label }}</h2>
      <ol>
        <li v-for="post in recommendations.slice(index * 3, index * 3 + 3)" :key="post.id">
          <RouterLink :to="'/posts/' + post.slug"
            ><small>{{ post.category.name }}</small
            >{{ post.title }}</RouterLink
          >
        </li>
      </ol>
    </div>
  </section>
  <footer class="site-footer">
    <div class="footer-stats">
      <span><FileText :size="14" />{{ posts.length }} 篇</span
      ><span><Clock3 :size="14" />{{ minutes }} 分钟</span
      ><RouterLink to="/posts"><BookOpen :size="14" />所有文章</RouterLink>
    </div>
    <p>© 2025–2026 <Flower2 :size="16" aria-hidden="true" /> 春日来信 @Koharu</p>
    <p class="footer-credit">
      Vue 模板 · 视觉参考
      <a href="https://github.com/cosZone/astro-koharu" target="_blank" rel="noopener noreferrer"
        >astro-koharu v7.7.4</a
      >
    </p>
  </footer>
</template>
