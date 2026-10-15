<script setup lang="ts">
import { provide, ref, shallowRef, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import SiteHeader from '@/components/SiteHeader.vue'
import SiteHero from '@/components/SiteHero.vue'
import SiteSidebar from '@/components/SiteSidebar.vue'
import MobileDrawer from '@/components/MobileDrawer.vue'
import { useTheme } from '@/composables/useTheme'
import { defaultSiteCover, siteCoverKey, type SiteCover } from '@/app/site-cover'

const route = useRoute()
const { theme, toggleTheme } = useTheme()
const drawerOpen = ref(false)
const siteCover = shallowRef<SiteCover>(defaultSiteCover(route.path))
let coverOwner: string | null = null

provide(siteCoverKey, {
  set(owner, cover) {
    if (owner !== route.fullPath) return
    coverOwner = owner
    siteCover.value = cover
  },
  clear(owner) {
    if (coverOwner !== owner || owner !== route.fullPath) return
    coverOwner = null
    siteCover.value = defaultSiteCover(route.path)
  },
})

watch(
  () => route.fullPath,
  () => {
    coverOwner = null
    siteCover.value = defaultSiteCover(route.path)
    drawerOpen.value = false
  },
  { flush: 'sync' },
)
</script>

<template>
  <div class="site">
    <a class="skip-link" href="#main-content">跳转到正文</a>
    <SiteHeader v-model:drawer-open="drawerOpen" :theme="theme" @toggle-theme="toggleTheme" />
    <SiteHero :cover="siteCover" />
    <MobileDrawer :open="drawerOpen" @close="drawerOpen = false">
      <SiteSidebar variant="drawer" />
    </MobileDrawer>
    <div class="content-shell">
      <SiteSidebar class="sidebar-column" variant="sidebar" />
      <main id="main-content" class="site-main" tabindex="-1">
        <RouterView v-slot="{ Component }">
          <Transition name="page">
            <div :key="route.path" class="page-transition">
              <component :is="Component" />
            </div>
          </Transition>
        </RouterView>
      </main>
    </div>
    <footer class="site-footer">
      <div class="footer-inner">
        <span><span class="footer-flower" aria-hidden="true">✿</span> Koharu · 收藏平凡的闪光</span>
        <nav aria-label="页脚导航">
          <RouterLink to="/about">关于</RouterLink>
          <RouterLink to="/archives">归档</RouterLink>
          <RouterLink to="/friends">友链</RouterLink>
        </nav>
        <small>© 2026 Koharu</small>
      </div>
    </footer>
  </div>
</template>
