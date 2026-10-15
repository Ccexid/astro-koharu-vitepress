<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  Archive,
  BookOpen,
  FolderOpen,
  Hash,
  Home,
  Info,
  Link,
  List,
  UserRound,
  Flower2,
  Github,
  Mail,
  Tv,
} from 'lucide-vue-next'
import ArticleToc from '@/components/post/ArticleToc.vue'
import { listCategories, listPosts, listTags } from '@/services/posts'
import type { SiteCover } from '@/app/site-cover'
const props = withDefaults(
  defineProps<{ variant?: 'sidebar' | 'drawer'; cover?: SiteCover; activeId?: string }>(),
  { variant: 'sidebar', activeId: '' },
)
defineEmits<{ navigate: [] }>()
const route = useRoute()
const panel = ref<'profile' | 'toc'>('profile')
const stats = ref({ posts: 0, categories: 0, tags: 0 })
const error = ref(false)
const article = computed(() => props.cover?.kind === 'article')
const nav = [
  { label: '首页', to: '/', icon: Home },
  { label: '所有文章', to: '/posts', icon: BookOpen },
  { label: '分类', to: '/categories', icon: FolderOpen },
  { label: '标签', to: '/tags', icon: Hash },
  { label: '归档', to: '/archives', icon: Archive },
  { label: '友链', to: '/friends', icon: Link },
  { label: '关于', to: '/about', icon: Info },
  { label: '追番', to: '/bangumi', icon: Tv },
]
async function load() {
  error.value = false
  try {
    const [posts, categories, tags] = await Promise.all([listPosts(), listCategories(), listTags()])
    stats.value = { posts: posts.length, categories: categories.length, tags: tags.length }
  } catch {
    error.value = true
  }
}
watch(
  () => route.path,
  () => {
    panel.value = article.value ? 'toc' : 'profile'
  },
  { immediate: true, flush: 'post' },
)
watch(article, (value) => {
  panel.value = value ? 'toc' : 'profile'
})
onMounted(load)
</script>
<template>
  <aside class="site-sidebar" :class="{ 'is-drawer': variant === 'drawer' }" aria-label="站点侧栏">
    <div v-if="article" class="sidebar-tabs" role="group" aria-label="侧栏内容">
      <button type="button" :aria-pressed="panel === 'profile'" @click="panel = 'profile'">
        <UserRound :size="16" aria-hidden="true" />站点概览
      </button>
      <button type="button" :aria-pressed="panel === 'toc'" @click="panel = 'toc'">
        <List :size="16" aria-hidden="true" />文章目录
      </button>
    </div>
    <ArticleToc
      v-if="article && panel === 'toc'"
      :sections="cover?.sections || []"
      :active-id="activeId"
      @navigate="$emit('navigate')"
    />
    <template v-else>
      <div class="profile-panel">
        <div class="profile-identity">
          <div class="profile-avatar" role="img" aria-label="春日花朵头像">
            <Flower2 :size="56" :stroke-width="1" aria-hidden="true" />
          </div>
          <div>
            <h2>春日来信</h2>
            <p class="profile-bio">写下生活里细小而明亮的片刻。</p>
            <div class="profile-social">
              <a
                href="https://github.com/Ccexid/astro-koharu-vitepress"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="查看参考主题仓库"
                ><Github :size="19" /></a
              ><RouterLink to="/about#contact" aria-label="联系方式"><Mail :size="19" /></RouterLink>
            </div>
          </div>
        </div>
        <div v-if="!error" class="profile-stats">
          <RouterLink to="/posts"
            ><strong>{{ stats.posts }}</strong
            ><small>文章</small></RouterLink
          >
          <RouterLink to="/categories"
            ><strong>{{ stats.categories }}</strong
            ><small>分类</small></RouterLink
          >
          <RouterLink to="/tags"
            ><strong>{{ stats.tags }}</strong
            ><small>标签</small></RouterLink
          >
        </div>
        <p v-else class="sidebar-error">统计暂不可用 <button type="button" @click="load">重试</button></p>
      </div>
      <nav class="sidebar-nav" aria-label="内容导航">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          :class="{ 'is-active': item.to === '/' ? route.path === '/' : route.path.startsWith(item.to) }"
          @click="$emit('navigate')"
          ><component :is="item.icon" :size="18" aria-hidden="true" />{{ item.label }}</RouterLink
        >
      </nav>
    </template>
  </aside>
</template>
