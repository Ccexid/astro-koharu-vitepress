<script setup lang="ts">
import { computed, provide, ref, shallowRef, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import SiteHeader from '@/components/SiteHeader.vue'
import SiteHero from '@/components/SiteHero.vue'
import SiteSidebar from '@/components/SiteSidebar.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import FloatingTools from '@/components/FloatingTools.vue'
import MobileDrawer from '@/components/MobileDrawer.vue'
import { useTheme } from '@/composables/useTheme'
import { useReadingPosition } from '@/composables/useReadingPosition'
import { defaultSiteCover, siteCoverKey, type SiteCover } from '@/app/site-cover'
const route = useRoute()
const { theme, toggleTheme } = useTheme()
const drawerOpen = ref(false)
const siteCover = shallowRef<SiteCover>(defaultSiteCover(route.path))
const { activeId, progress, scrolled, headerHidden } = useReadingPosition(siteCover)
const showRecommendations = computed(
  () =>
    route.path === '/' ||
    route.path === '/about' ||
    siteCover.value.kind === 'article' ||
    route.path === '/friends',
)
let coverOwner: string | null = null
provide(siteCoverKey, {
  set(owner, cover) {
    if (owner !== route.path) return
    coverOwner = owner
    siteCover.value = cover
  },
  clear(owner) {
    if (coverOwner !== owner || owner !== route.path) return
    coverOwner = null
    siteCover.value = defaultSiteCover(route.path)
  },
})
watch(
  () => route.path,
  () => {
    coverOwner = null
    siteCover.value = defaultSiteCover(route.path)
    drawerOpen.value = false
  },
  { flush: 'sync' },
)
</script>
<template>
  <div class="site" :class="{ 'is-post-list': route.path === '/posts' }">
    <a class="skip-link" href="#main-content">跳转到正文</a>
    <SiteHeader
      v-model:drawer-open="drawerOpen"
      :theme="theme"
      :cover="siteCover"
      :active-id="activeId"
      :progress="progress"
      :scrolled="scrolled"
      :hidden="headerHidden"
      @toggle-theme="toggleTheme"
    />
    <SiteHero :cover="siteCover" />
    <MobileDrawer :open="drawerOpen" @close="drawerOpen = false">
      <SiteSidebar variant="drawer" :cover="siteCover" :active-id="activeId" @navigate="drawerOpen = false" />
    </MobileDrawer>
    <div class="content-shell">
      <SiteSidebar class="sidebar-column" :cover="siteCover" :active-id="activeId" />
      <div class="main-column">
        <main id="main-content" class="site-main page-content" tabindex="-1">
          <RouterView v-slot="{ Component }"><component :is="Component" :key="route.path" /></RouterView>
        </main>
        <SiteFooter
          :show-recommendations="showRecommendations"
          :article-slug="siteCover.kind === 'article' ? String(route.params.slug) : undefined"
        />
      </div>
    </div>
    <FloatingTools :reading="siteCover.kind === 'article'" :progress="progress" />
  </div>
</template>
