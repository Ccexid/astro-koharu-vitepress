<script setup lang="ts">
import { computed, ref, watch, type Component } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { List, UserRound, Flower2 } from 'lucide-vue-next'
import ArticleToc from '@/components/post/ArticleToc.vue'
import type { SiteCover } from '@/app/site-cover'
import { isNavigationActive, siteConfig } from '@/config/site'
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
const nav = siteConfig.navigation.sidebar
const panel = ref<'profile' | 'toc'>('profile')
const article = computed(() => props.cover?.kind === 'article')
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
  <aside
    class="site-sidebar"
    :class="{ 'is-drawer': variant === 'drawer' }"
    :aria-label="siteConfig.navigation.ariaLabel"
  >
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
            <h2>{{ siteConfig.author }}</h2>
            <p class="profile-bio">{{ siteConfig.profileDescription }}</p>
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
          <RouterLink :to="siteConfig.navigation.articles.items[0].to"
            ><strong>{{ props.stats.posts }}</strong
            ><small>文章</small></RouterLink
          >
          <RouterLink :to="siteConfig.navigation.articles.items[1].to"
            ><strong>{{ props.stats.categories }}</strong
            ><small>分类</small></RouterLink
          >
          <RouterLink :to="siteConfig.navigation.articles.items[2].to"
            ><strong>{{ props.stats.tags }}</strong
            ><small>标签</small></RouterLink
          >
        </div>
        <p v-else class="sidebar-error">
          统计暂不可用 <button type="button" @click="emit('retry')">重试</button>
        </p>
      </div>
      <nav class="sidebar-nav" :aria-label="siteConfig.navigation.ariaLabel">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          :class="{ 'is-active': isNavigationActive(route.path, item.to) }"
          @click="emit('navigate')"
        >
          <component :is="item.icon" :size="18" aria-hidden="true" />{{ item.label }}
        </RouterLink>
      </nav>
    </template>
  </aside>
</template>
