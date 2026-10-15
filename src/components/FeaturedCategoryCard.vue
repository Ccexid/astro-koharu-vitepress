<script setup lang="ts">
import { computed, onMounted, onScopeDispose, ref, useId } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, RotateCcw } from 'lucide-vue-next'
import type { Post, TaxonomyItem } from '@/types/post'

defineProps<{ category: TaxonomyItem; image?: string; posts: Post[] }>()
const panelId = useId()
const expanded = ref(false)
const hovered = ref(false)
const focusedBack = ref(false)
const reduced = ref(false)
const toggle = ref<HTMLButtonElement | null>(null)
const open = computed(() => expanded.value || hovered.value || focusedBack.value)
let timer: ReturnType<typeof setTimeout> | undefined
let query: MediaQueryList | undefined
function enter() {
  if (reduced.value || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
  timer = setTimeout(() => {
    hovered.value = true
  }, 100)
}
function leave() {
  clearTimeout(timer)
  hovered.value = false
}
function close() {
  leave()
  expanded.value = false
  focusedBack.value = false
  toggle.value?.focus()
}
function toggleExpansion() {
  const next = !open.value
  leave()
  expanded.value = next
}
function leaveBack(event: FocusEvent) {
  focusedBack.value = !!(
    event.relatedTarget && (event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)
  )
}
function updateMotion() {
  reduced.value = !!query?.matches
  leave()
}
onMounted(() => {
  query = window.matchMedia('(prefers-reduced-motion: reduce)')
  updateMotion()
  query.addEventListener('change', updateMotion)
})
onScopeDispose(() => {
  clearTimeout(timer)
  query?.removeEventListener('change', updateMotion)
})
</script>
<template>
  <section
    class="featured-card"
    :class="{ 'is-open': open }"
    @pointerenter="enter"
    @pointerleave="leave"
    @keydown.esc="close"
  >
    <button
      ref="toggle"
      class="featured-toggle"
      type="button"
      :aria-expanded="open"
      :aria-controls="panelId"
      :aria-label="(open ? '收起' : '展开') + category.name + '的文章'"
      @click="toggleExpansion"
    >
      <RotateCcw :size="16" aria-hidden="true" />{{ open ? '收起' : '查看文章' }}
    </button>
    <div class="featured-flip">
      <RouterLink class="featured-front" :to="'/categories/' + category.slug" :inert="open && !reduced">
        <img :src="image" alt="" loading="lazy" />
        <h3>{{ category.name }}</h3>
        <span>{{ category.count }} 篇文章</span>
      </RouterLink>
      <div
        :id="panelId"
        class="featured-back"
        :inert="!open && !reduced"
        @focusin="focusedBack = true"
        @focusout="leaveBack"
      >
        <h3>{{ category.name }}</h3>
        <RouterLink v-for="post in posts" :key="post.id" :to="'/posts/' + post.slug">{{
          post.title
        }}</RouterLink>
        <RouterLink class="featured-more" :to="'/categories/' + category.slug"
          >全部 {{ category.count }} 篇文章<ArrowRight :size="15" aria-hidden="true"
        /></RouterLink>
      </div>
    </div>
  </section>
</template>
<style scoped>
.featured-card {
  position: relative;
  perspective: 1000px;
  min-width: 0;
}
.featured-flip {
  display: grid;
  transform-style: preserve-3d;
  transition: transform 720ms var(--motion-ease-route);
}
.featured-card.is-open .featured-flip {
  transform: rotateY(-180deg);
}
.featured-front,
.featured-back {
  grid-area: 1 / 1;
  min-height: 240px;
  border-radius: 8px;
  backface-visibility: hidden;
  overflow: hidden;
}
.featured-front {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  text-decoration: none;
  background: var(--petal-soft);
}
.featured-front img,
.featured-front::after {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.featured-front::after {
  content: '';
  background: rgb(24 16 23 / 38%);
}
.featured-front h3,
.featured-front span {
  z-index: 1;
  text-shadow: 0 2px 6px #0008;
}
.featured-front h3 {
  margin: 0 0 8px;
  font-size: 1.5rem;
}
.featured-front span {
  font-size: 0.8rem;
}
.featured-back {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  padding: 24px 24px 50px;
  background: var(--surface);
  transform: rotateY(-180deg);
}
.featured-back h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--petal-deep);
}
.featured-back a {
  color: var(--ink);
  font-size: 0.85rem;
  text-decoration: none;
}
.featured-more {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: var(--petal-deep) !important;
}
.featured-toggle {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 5px 10px;
  background: var(--surface);
  color: var(--ink);
  font-size: 0.75rem;
}
.featured-card:focus-within {
  outline: 2px solid var(--petal);
  outline-offset: 4px;
  border-radius: 8px;
}
@media (prefers-reduced-motion: reduce) {
  .featured-flip,
  .featured-card.is-open .featured-flip {
    transform: none;
    transition: none;
  }
  .featured-front,
  .featured-back {
    grid-area: auto;
    transform: none;
    min-height: 180px;
  }
  .featured-toggle {
    display: none;
  }
  .featured-back {
    padding-bottom: 24px;
  }
}
</style>
