<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import SiteHeader from './components/SiteHeader.vue'
import SiteHero from './components/SiteHero.vue'
import SiteSidebar from './components/SiteSidebar.vue'
import { useTheme } from './composables/useTheme'

const route = useRoute()
const { theme, toggleTheme } = useTheme()
</script>

<template>
  <div class="site">
    <a class="skip-link" href="#main-content">跳转到正文</a>
    <SiteHeader :theme="theme" @toggle-theme="toggleTheme" />
    <SiteHero />
    <div class="content-shell">
      <SiteSidebar class="sidebar-column" />
      <main id="main-content" class="site-main" tabindex="-1">
        <RouterView v-slot="{ Component }">
          <Transition name="page">
            <div :key="route.fullPath" class="page-transition">
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
