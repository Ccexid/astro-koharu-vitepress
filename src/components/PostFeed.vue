<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue'
import { Search, X } from 'lucide-vue-next'
import InfiniteLoadMore from '@/components/InfiniteLoadMore.vue'
import PostCard from './PostCard.vue'
import { useScrollReveal } from '@/composables/useScrollReveal'
import type { Post } from '@/types/post'

const props = withDefaults(defineProps<{ posts: Post[]; searchable?: boolean; pageSize?: number }>(), {
  searchable: false,
  pageSize: 4,
})

const query = ref('')
const visibleCount = ref(props.pageSize)
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
const visiblePosts = computed(() => filteredPosts.value.slice(0, visibleCount.value))
const hasMore = computed(() => visiblePosts.value.length < filteredPosts.value.length)
const postFeed = useTemplateRef<HTMLDivElement>('postFeed')

useScrollReveal(postFeed, visiblePosts)

watch([query, () => props.posts, () => props.pageSize], () => {
  visibleCount.value = props.pageSize
})

function loadMore(): void {
  visibleCount.value = Math.min(visibleCount.value + props.pageSize, filteredPosts.value.length)
}
</script>

<template>
  <div v-if="searchable" class="feed-tools">
    <label class="search-field">
      <Search :size="18" aria-hidden="true" />
      <input v-model="query" type="search" placeholder="搜索标题、分类或标签" aria-label="筛选文章" />
      <button v-if="query" type="button" aria-label="清除筛选" @click="query = ''">
        <X :size="16" aria-hidden="true" />
      </button>
    </label>
    <span class="feed-count">{{ filteredPosts.length }} 篇文章</span>
  </div>

  <div v-if="visiblePosts.length" ref="postFeed" class="post-feed">
    <PostCard
      v-for="(post, index) in visiblePosts"
      :key="post.id"
      :post="post"
      :left-clip="index % 2 === 0"
    />
  </div>
  <div v-else class="empty-state">
    <h2>还没有找到文章</h2>
    <p>{{ query ? '换个关键词再试试。' : '这里暂时没有文章，过一会儿再来看看。' }}</p>
    <button v-if="query" type="button" class="text-button" @click="query = ''">清除筛选</button>
  </div>

  <InfiniteLoadMore
    v-if="visiblePosts.length && hasMore"
    :has-more="hasMore"
    :is-loading="false"
    load-more-text="继续下滑加载"
    @load-more="loadMore"
  />
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
