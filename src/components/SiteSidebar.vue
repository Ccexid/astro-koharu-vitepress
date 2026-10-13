<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { listCategories, listPosts, listTags } from '../services/posts'
import type { Post, TaxonomyItem } from '../types/post'

const posts = ref<Post[]>([])
const categories = ref<TaxonomyItem[]>([])
const tags = ref<TaxonomyItem[]>([])

onMounted(async () => {
  ;[posts.value, categories.value, tags.value] = await Promise.all([
    listPosts(),
    listCategories(),
    listTags(),
  ])
})
</script>

<template>
  <aside class="site-sidebar" aria-label="作者与内容导航">
    <section class="profile-panel">
      <div class="profile-avatar" aria-hidden="true">春</div>
      <h2>一封春日来信</h2>
      <p class="profile-handle">Koharu's journal</p>
      <p class="profile-bio">写下生活里细小而明亮的片刻。</p>
      <div class="profile-stats" aria-label="站点统计">
        <span
          ><strong>{{ posts.length }}</strong
          ><small>篇文章</small></span
        >
        <span
          ><strong>{{ categories.length }}</strong
          ><small>个分类</small></span
        >
        <span
          ><strong>{{ tags.length }}</strong
          ><small>个标签</small></span
        >
      </div>
    </section>

    <section class="sidebar-section">
      <div class="sidebar-heading">
        <h2>最近更新</h2>
        <RouterLink to="/posts" aria-label="查看全部文章">全部</RouterLink>
      </div>
      <ul class="recent-list">
        <li v-for="post in posts.slice(0, 3)" :key="post.id">
          <RouterLink :to="`/posts/${post.slug}`">{{ post.title }}</RouterLink>
          <time :datetime="post.publishedAt">{{ post.publishedAt.replaceAll('-', '.') }}</time>
        </li>
      </ul>
    </section>

    <section class="sidebar-section">
      <div class="sidebar-heading">
        <h2>漫游分类</h2>
        <RouterLink to="/categories" aria-label="查看全部分类">全部</RouterLink>
      </div>
      <ul class="category-list">
        <li v-for="category in categories" :key="category.slug">
          <RouterLink :to="`/categories/${category.slug}`">
            <span>{{ category.name }}</span
            ><span>{{ category.count }}</span>
          </RouterLink>
        </li>
      </ul>
    </section>

    <section class="sidebar-section tag-section">
      <div class="sidebar-heading">
        <h2>随手标签</h2>
        <RouterLink to="/tags">全部</RouterLink>
      </div>
      <div class="sidebar-tags">
        <RouterLink v-for="tag in tags.slice(0, 7)" :key="tag.slug" :to="`/tags/${tag.slug}`">
          {{ tag.name }}
        </RouterLink>
      </div>
    </section>
  </aside>
</template>

<style scoped>
.site-sidebar {
  display: grid;
  align-content: start;
  gap: 28px;
  min-width: 0;
}

.profile-panel {
  padding: 10px 8px 25px;
  text-align: center;
  border-bottom: 1px solid var(--line);
}

.profile-avatar {
  display: grid;
  width: 86px;
  aspect-ratio: 1;
  margin: 0 auto 15px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: var(--petal-soft);
  color: var(--petal-deep);
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 2.1rem;
}

.profile-panel h2 {
  margin: 0;
  font-family: 'Iowan Old Style', 'Noto Serif SC', 'Songti SC', serif;
  font-size: 1.15rem;
  font-weight: 650;
}

.profile-handle {
  margin: 5px 0 12px;
  color: var(--muted);
  font-family: Georgia, serif;
  font-size: 0.75rem;
}

.profile-bio {
  max-width: 220px;
  margin: 0 auto;
  color: var(--muted);
  font-size: 0.84rem;
  line-height: 1.75;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-top: 22px;
}

.profile-stats span {
  display: grid;
  gap: 4px;
}

.profile-stats span + span {
  border-left: 1px solid var(--line);
}

.profile-stats strong {
  font-family: Georgia, serif;
  font-size: 1rem;
  font-weight: 600;
}

.profile-stats small {
  color: var(--muted);
  font-size: 0.72rem;
}

.sidebar-section {
  min-width: 0;
}

.sidebar-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 13px;
}

.sidebar-heading h2 {
  margin: 0;
  font-size: 0.93rem;
  font-weight: 700;
}

.sidebar-heading > a {
  color: var(--muted);
  font-size: 0.75rem;
  text-decoration: none;
}

.recent-list,
.category-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.recent-list li {
  display: grid;
  gap: 4px;
}

.recent-list a,
.category-list a {
  color: var(--ink);
  font-size: 0.84rem;
  line-height: 1.5;
  text-decoration: none;
}

.recent-list time {
  color: var(--muted);
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 0.68rem;
}

.category-list a {
  display: flex;
  justify-content: space-between;
}

.category-list a span:last-child {
  color: var(--muted);
  font-family: Georgia, serif;
  font-size: 0.76rem;
}

.sidebar-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.sidebar-tags a {
  padding: 5px 9px;
  border: 1px solid var(--line);
  border-radius: 3px;
  color: var(--muted);
  font-size: 0.73rem;
  text-decoration: none;
}

@media (hover: hover) and (pointer: fine) {
  .sidebar-heading > a:hover,
  .recent-list a:hover,
  .category-list a:hover {
    color: var(--petal-deep);
  }

  .sidebar-tags a:hover {
    border-color: var(--petal);
    color: var(--petal-deep);
  }
}
</style>
