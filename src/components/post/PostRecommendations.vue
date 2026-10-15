<script setup lang="ts">
import { computed, onScopeDispose, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { getPostRecommendations } from '@/services/posts'
import { useScrollReveal } from '@/composables/useScrollReveal'
import type { PostRecommendations } from '@/types/post'

const props = defineProps<{ pageKey: string; articleSlug?: string }>()
const container = ref<HTMLElement | null>(null)
const result = ref<PostRecommendations>({ random: [], secondary: [], hasRelated: false })
const loading = ref(true)
const error = ref(false)
let request = 0
const groups = computed(() =>
  [
    { id: 'random', title: '随机文章', posts: result.value.random, start: 1, fallback: false },
    {
      id: 'secondary',
      title: result.value.hasRelated ? '相关文章' : '',
      posts: result.value.secondary,
      start: result.value.hasRelated ? 1 : result.value.random.length + 1,
      fallback: !result.value.hasRelated,
    },
  ].filter((group) => group.posts.length),
)
useScrollReveal(container, groups, '.recommendation-link')

async function load() {
  const id = ++request
  loading.value = true
  error.value = false
  try {
    const next = await getPostRecommendations(props.articleSlug)
    if (id === request) result.value = next
  } catch {
    if (id === request) error.value = true
  } finally {
    if (id === request) loading.value = false
  }
}
watch(() => [props.pageKey, props.articleSlug], load, { immediate: true })
onScopeDispose(() => {
  request++
})
</script>
<template>
  <section
    v-if="loading || error || groups.length"
    ref="container"
    class="footer-recommendations"
    aria-label="文章推荐"
    :aria-busy="loading"
  >
    <p v-if="loading" class="recommendation-status" role="status">正在准备推荐文章…</p>
    <p v-else-if="error" class="recommendation-status" role="alert">
      推荐暂时无法加载。<button type="button" @click="load">重试</button>
    </p>
    <template v-else>
      <div
        v-for="group in groups"
        :key="group.id"
        class="recommendation-group"
        :class="{ 'is-continuation': group.fallback }"
        :aria-label="group.title || '随机文章（续）'"
      >
        <h2 v-if="group.title">{{ group.title }}</h2>
        <ol class="recommendation-list" :start="group.start">
          <li v-for="(post, index) in group.posts" :key="post.id">
            <RouterLink class="recommendation-link" :to="'/posts/' + post.slug">
              <span class="recommendation-index" aria-hidden="true">{{ group.start + index }}</span>
              <span class="recommendation-copy"
                ><span class="recommendation-category">{{ post.category.name }}</span
                ><span class="recommendation-title">{{ post.title }}</span></span
              >
            </RouterLink>
          </li>
        </ol>
      </div>
    </template>
  </section>
</template>
<style scoped>
.footer-recommendations {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding: 0 40px;
  margin: 32px 0;
}
.recommendation-group {
  min-width: 0;
}
.recommendation-group h2 {
  margin: 0 0 16px;
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: 600;
  color: color-mix(in srgb, var(--ink) 80%, transparent);
}
.recommendation-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.is-continuation {
  padding-top: 48px;
}
.recommendation-link {
  --reveal-distance: 0.75rem;
  display: flex;
  min-width: 0;
  gap: 12px;
  padding: 8px;
  border-radius: 6px;
  text-decoration: none;
  transition:
    color var(--motion-duration-base),
    background-color var(--motion-duration-base);
}
.recommendation-index {
  flex-shrink: 0;
  font:
    0.875rem/1.25rem ui-monospace,
    monospace;
  color: color-mix(in srgb, var(--ink) 30%, transparent);
}
.recommendation-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}
.recommendation-category {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.75rem;
  line-height: 1rem;
  color: color-mix(in srgb, var(--ink) 50%, transparent);
}
.recommendation-title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: color-mix(in srgb, var(--ink) 80%, transparent);
  transition: color var(--motion-duration-base);
}
.recommendation-link:focus-visible {
  outline: 2px solid var(--petal);
  outline-offset: 2px;
}
.recommendation-link:focus-visible .recommendation-title {
  color: var(--petal-deep);
}
.recommendation-status {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--muted);
  font-size: 0.85rem;
}
.recommendation-status button {
  border: 0;
  background: transparent;
  color: var(--petal-deep);
}
@media (hover: hover) and (pointer: fine) {
  .recommendation-link:hover {
    background: color-mix(in srgb, var(--ink) 5%, transparent);
  }
  .recommendation-link:hover .recommendation-title {
    color: var(--petal-deep);
  }
}
@media (max-width: 992px) {
  .footer-recommendations {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 768px) {
  .footer-recommendations {
    padding-inline: 24px;
  }
  .is-continuation {
    padding-top: 0;
  }
}
</style>
