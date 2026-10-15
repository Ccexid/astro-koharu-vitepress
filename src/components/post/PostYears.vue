<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Flower2 } from 'lucide-vue-next'
import type { Post } from '@/types/post'
const props = withDefaults(defineProps<{ posts: Post[]; anchors?: boolean; showCategory?: boolean }>(), {
  anchors: false,
  showCategory: true,
})
const years = computed(() => {
  const groups = new Map<string, Post[]>()
  for (const post of [...props.posts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))) {
    const year = post.publishedAt.slice(0, 4)
    groups.set(year, [...(groups.get(year) || []), post])
  }
  return [...groups.entries()].map(([year, posts]) => ({ year, posts }))
})
function monthAnchor(posts: Post[], index: number): string | undefined {
  const month = posts[index]!.publishedAt.slice(0, 7)
  return props.anchors && (index === 0 || posts[index - 1]!.publishedAt.slice(0, 7) !== month)
    ? 'month-' + month
    : undefined
}
</script>
<template>
  <div v-if="years.length" class="post-years">
    <section
      v-for="group in years"
      :id="anchors ? 'year-' + group.year : undefined"
      :key="group.year"
      class="post-year"
      :tabindex="anchors ? -1 : undefined"
    >
      <h2 class="year-rule">
        <Flower2 :size="20" aria-hidden="true" /><span>{{ group.year }}</span
        ><span class="year-rule-line"></span><small>{{ group.posts.length }} 篇文章</small>
      </h2>
      <ol class="post-rows">
        <li
          v-for="(post, index) in group.posts"
          :id="monthAnchor(group.posts, index)"
          :key="post.id"
          class="post-row"
          :tabindex="monthAnchor(group.posts, index) ? -1 : undefined"
        >
          <time :datetime="post.publishedAt">{{ post.publishedAt.slice(5) }}</time>
          <RouterLink class="post-row-title" :to="'/posts/' + post.slug">{{ post.title }}</RouterLink>
          <RouterLink
            v-if="showCategory"
            class="post-row-category"
            :to="'/categories/' + post.category.slug"
            >{{ post.category.name }}</RouterLink
          >
        </li>
      </ol>
    </section>
  </div>
  <p v-else class="status-message" role="status">这里暂时没有文章。</p>
</template>
