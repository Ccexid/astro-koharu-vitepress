<script setup lang="ts">
import { computed, ref, watch, type Component } from 'vue'
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
  Tv,
} from 'lucide-vue-next'
import ArticleToc from '@/components/post/ArticleToc.vue'
import type { SiteCover } from '@/app/site-cover'
const props = withDefaults(
  defineProps<{
    variant?: 'sidebar' | 'drawer'
    cover?: SiteCover
    activeId?: string
    stats: { posts: number; categories: number; tags: number }
    statsError: boolean
    profileSocials: Array<{
      id: string
      label: string
      href: string
      component: Component
      internal: boolean
    }>
  }>(),
  { variant: 'sidebar', activeId: '' },
)
const emit = defineEmits<{ navigate: []; retry: [] }>()
const route = useRoute()
const panel = ref<'profile' | 'toc'>('profile')
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
      @navigate="emit('navigate')"
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
            <div v-if="props.profileSocials.length" class="profile-social">
              <template v-for="item in props.profileSocials" :key="item.id">
                <RouterLink
                  v-if="item.internal"
                  class="profile-social-link"
                  :to="item.href"
                  :aria-label="item.label || item.href"
                  :title="item.label || item.href"
                  @click="emit('navigate')"
                >
                  <component :is="item.component" :size="19" aria-hidden="true" />
                </RouterLink>
                <a
                  v-else
                  class="profile-social-link"
                  :href="item.href"
                  :target="/^https?:\/\//i.test(item.href) ? '_blank' : undefined"
                  :rel="/^https?:\/\//i.test(item.href) ? 'noopener noreferrer' : undefined"
                  :aria-label="item.label || item.href"
                  :title="item.label || item.href"
                >
                  <component :is="item.component" :size="19" aria-hidden="true" />
                </a>
              </template>
            </div>
          </div>
        </div>
        <div v-if="!props.statsError" class="profile-stats">
          <RouterLink to="/posts"
            ><strong>{{ props.stats.posts }}</strong
            ><small>文章</small></RouterLink
          >
          <RouterLink to="/categories"
            ><strong>{{ props.stats.categories }}</strong
            ><small>分类</small></RouterLink
          >
          <RouterLink to="/tags"
            ><strong>{{ props.stats.tags }}</strong
            ><small>标签</small></RouterLink
          >
        </div>
        <p v-else class="sidebar-error">
          统计暂不可用 <button type="button" @click="emit('retry')">重试</button>
        </p>
      </div>
      <nav class="sidebar-nav" aria-label="内容导航">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          :class="{ 'is-active': item.to === '/' ? route.path === '/' : route.path.startsWith(item.to) }"
          @click="emit('navigate')"
        >
          <component :is="item.icon" :size="18" aria-hidden="true" />{{ item.label }}
        </RouterLink>
      </nav>
    </template>
  </aside>
</template>
