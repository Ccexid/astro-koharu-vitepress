<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue'
import { ArrowLeft, ArrowRight, Search, X } from 'lucide-vue-next'
import PostCard from './PostCard.vue'
import { useScrollReveal } from '../composables/useScrollReveal'
import type { Post } from '../types/post'

const props = withDefaults(
  defineProps<{ posts: Post[]; searchable?: boolean; pageSize?: number }>(),
  {
    searchable: false,
    pageSize: 4,
  },
)

const query = ref('')
const page = ref(1)
const filteredPosts = computed(() => {
  const value = query.value.trim().toLocaleLowerCase()
  if (!value) return props.posts
  return props.posts.filter((post) =>
    [post.title, post.excerpt, post.category.name, ...post.tags.map((tag) => tag.name)]
      .join(' ')
      .toLocaleLowerCase()
      .includes(value),
  )
})
const pageCount = computed(() =>
  Math.max(1, Math.ceil(filteredPosts.value.length / props.pageSize)),
)
const visiblePosts = computed(() =>
  filteredPosts.value.slice((page.value - 1) * props.pageSize, page.value * props.pageSize),
)
const postFeed = useTemplateRef<HTMLDivElement>('postFeed')

useScrollReveal(postFeed, visiblePosts)

watch([query, () => props.posts], () => {
  page.value = 1
})

function goToPage(nextPage: number) {
  page.value = Math.min(Math.max(1, nextPage), pageCount.value)
}
</script>

<template>
  <div v-if="searchable" class="feed-tools">
    <label class="search-field">
      <Search :size="18" aria-hidden="true" />
      <input
        v-model="query"
        type="search"
        placeholder="搜索标题、分类或标签"
        aria-label="筛选文章"
      />
      <button v-if="query" type="button" aria-label="清除筛选" @click="query = ''">
        <X :size="16" aria-hidden="true" />
      </button>
    </label>
    <span class="feed-count">{{ filteredPosts.length }} 篇文章</span>
  </div>

  <div v-if="visiblePosts.length" ref="postFeed" class="post-feed">
    <PostCard v-for="post in visiblePosts" :key="post.id" :post="post" />
  </div>
  <div v-else class="empty-state">
    <h2>还没有找到文章</h2>
    <p>{{ query ? '换个关键词再试试。' : '这里暂时没有文章，过一会儿再来看看。' }}</p>
    <button v-if="query" type="button" class="text-button" @click="query = ''">清除筛选</button>
  </div>

  <nav v-if="pageCount > 1" class="pagination" aria-label="文章分页">
    <button type="button" :disabled="page === 1" aria-label="上一页" @click="goToPage(page - 1)">
      <ArrowLeft :size="16" aria-hidden="true" />
    </button>
    <button
      v-for="number in pageCount"
      :key="number"
      type="button"
      :aria-label="`第 ${number} 页`"
      :aria-current="page === number ? 'page' : undefined"
      :class="{ 'is-current': page === number }"
      @click="goToPage(number)"
    >
      {{ number }}
    </button>
    <button
      type="button"
      :disabled="page === pageCount"
      aria-label="下一页"
      @click="goToPage(page + 1)"
    >
      <ArrowRight :size="16" aria-hidden="true" />
    </button>
  </nav>
</template>

<style scoped>
.feed-tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}
.search-field {
  display: flex;
  width: min(100%, 380px);
  min-height: 42px;
  align-items: center;
  gap: 9px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--surface);
  color: var(--muted);
}
.search-field:focus-within {
  border-color: var(--petal);
}
.search-field input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 0.84rem;
}
.search-field input::placeholder {
  color: var(--muted);
}
.search-field button {
  display: grid;
  width: 25px;
  height: 25px;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}
.feed-count {
  color: var(--muted);
  font-size: 0.76rem;
  white-space: nowrap;
}
.post-feed {
  display: grid;
  gap: 17px;
}
.empty-state {
  padding: 58px 20px;
  border: 1px dashed var(--line);
  color: var(--muted);
  text-align: center;
}
.empty-state h2 {
  margin: 0 0 7px;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 1.2rem;
}
.empty-state p {
  margin: 0;
  font-size: 0.87rem;
}
.text-button {
  margin-top: 14px;
  border: 0;
  background: transparent;
  color: var(--petal-deep);
  font: inherit;
  cursor: pointer;
}
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin-top: 30px;
}
.pagination button {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--surface);
  color: var(--ink);
  font: inherit;
  font-size: 0.82rem;
  cursor: pointer;
}
.pagination button.is-current {
  border-color: var(--petal-deep);
  background: var(--petal-deep);
  color: #fff;
}
.pagination button:disabled {
  color: var(--muted);
  cursor: not-allowed;
  opacity: 0.5;
}
@media (max-width: 500px) {
  .feed-tools {
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
  }
  .search-field {
    width: 100%;
  }
}
</style>
