<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { Menu, X } from 'lucide-vue-next'
import { RouterLink, useRoute } from 'vue-router'
import { isNavigationActive, siteNavigation } from '@/app/navigation'
import type { Theme } from '@/composables/useTheme'

defineProps<{ theme: Theme }>()
const drawerOpen = defineModel<boolean>('drawerOpen', { default: false })
const emit = defineEmits<{ toggleTheme: [origin: HTMLElement] }>()
const route = useRoute()
const isScrolled = ref(false)

function closeDrawer() {
  drawerOpen.value = false
}

function syncScrollState() {
  isScrolled.value = window.scrollY > 32
}

function handleThemeToggle(event: MouseEvent) {
  if (event.currentTarget instanceof HTMLElement) {
    emit('toggleTheme', event.currentTarget)
  }
}

watch(() => route.fullPath, closeDrawer)

onMounted(() => {
  syncScrollState()
  window.addEventListener('scroll', syncScrollState, { passive: true })
})

onUnmounted(() => window.removeEventListener('scroll', syncScrollState))
</script>

<template>
  <header class="site-header" :class="{ 'is-scrolled': isScrolled }">
    <div class="header-inner">
      <button
        class="icon-button menu-toggle"
        type="button"
        :aria-label="drawerOpen ? '关闭导航抽屉' : '打开导航抽屉'"
        :aria-expanded="drawerOpen"
        aria-controls="mobile-drawer"
        @click="drawerOpen = !drawerOpen"
      >
        <X v-if="drawerOpen" :size="18" aria-hidden="true" />
        <Menu v-else :size="18" aria-hidden="true" />
      </button>

      <RouterLink class="wordmark" to="/" aria-label="Koharu 首页" @click="closeDrawer">
        <span class="wordmark-mark" aria-hidden="true">花</span>
        <span>Koharu</span>
      </RouterLink>

      <nav class="primary-nav" aria-label="主导航">
        <RouterLink
          v-for="link in siteNavigation"
          :key="link.to"
          :to="link.to"
          :class="{ 'is-active': isNavigationActive(route.path, link.to) }"
        >
          {{ link.label }}
        </RouterLink>
      </nav>

      <button
        class="icon-button theme-toggle"
        type="button"
        :aria-label="theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'"
        :title="theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'"
        :aria-pressed="theme === 'dark'"
        @click="handleThemeToggle"
      >
        <span class="theme-toggle-icon" aria-hidden="true">
          <span class="theme-toggle-indicator" />
        </span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  position: absolute;
  z-index: 20;
  top: 0;
  right: 0;
  left: 0;
  color: #fff;
  transition: color var(--motion-duration-base) var(--motion-ease-hover);
}

.site-header.is-scrolled {
  position: fixed;
  color: var(--ink);
}

.header-inner {
  display: flex;
  width: min(calc(100% - var(--page-gutter) - var(--page-gutter)), var(--header-max-width));
  min-height: 74px;
  padding-inline: 20px;
  align-items: center;
  gap: 32px;
  margin: 0 auto;
  border-bottom: 1px solid rgb(255 255 255 / 24%);
  transition:
    background-color var(--motion-duration-base) var(--motion-ease-hover),
    border-color var(--motion-duration-base) var(--motion-ease-hover),
    border-radius var(--motion-duration-base) var(--motion-ease-hover),
    box-shadow var(--motion-duration-base) var(--motion-ease-hover),
    transform var(--motion-duration-base) var(--motion-ease-enter);
}

.site-header.is-scrolled .header-inner {
  transform: translateY(8px) scale(0.985);
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  box-shadow: var(--shadow-header);
  backdrop-filter: blur(16px) saturate(1.35);
}

.wordmark {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 9px;
  color: inherit;
  font-size: var(--text-lg);
  font-weight: 750;
  text-decoration: none;
}

.wordmark-mark {
  display: grid;
  width: 32px;
  aspect-ratio: 1;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 75%);
  border-radius: 50%;
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 15px;
  font-weight: 600;
}

.site-header.is-scrolled .wordmark-mark {
  border-color: var(--line);
  color: var(--petal-deep);
}

.primary-nav {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.primary-nav a {
  padding: 9px 11px;
  border-radius: var(--radius-pill);
  color: inherit;
  font-size: var(--text-sm);
  font-weight: 600;
  text-decoration: none;
  transition:
    background-color var(--motion-duration-fast) var(--motion-ease-hover),
    color var(--motion-duration-base) var(--motion-ease-hover);
}

.primary-nav a.is-active {
  background: rgb(255 255 255 / 19%);
}

.site-header.is-scrolled .primary-nav a.is-active {
  background: var(--petal-soft);
  color: var(--petal-deep);
}

.icon-button {
  display: inline-grid;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 45%);
  border-radius: 50%;
  background: rgb(42 31 39 / 20%);
  color: inherit;
  cursor: pointer;
  transition:
    background-color var(--motion-duration-fast) var(--motion-ease-hover),
    border-color var(--motion-duration-base) var(--motion-ease-hover),
    transform var(--motion-duration-fast) var(--motion-ease-hover),
    scale 200ms var(--motion-ease-hover);
}

.site-header.is-scrolled .icon-button {
  border-color: var(--line);
  background: var(--surface);
  color: var(--petal-deep);
}

.menu-toggle {
  display: none;
}

@media (hover: hover) and (pointer: fine) {
  .primary-nav a:hover {
    background: rgb(255 255 255 / 19%);
  }

  .site-header.is-scrolled .primary-nav a:hover {
    background: var(--petal-soft);
    color: var(--petal-deep);
  }

  .icon-button:hover {
    transform: translateY(-1px);
  }
}

@media (max-width: 820px) {
  .header-inner {
    width: 100%;
    min-height: 66px;
    justify-content: space-between;
    gap: 14px;
    padding-inline: var(--page-gutter);
  }

  .site-header.is-scrolled .header-inner {
    transform: none;
    border: 0;
    border-bottom: 1px solid var(--line);
    border-radius: 0;
    background: color-mix(in srgb, var(--surface) 94%, transparent);
  }

  .menu-toggle {
    display: inline-grid;
  }

  .icon-button {
    width: 44px;
    height: 44px;
  }

  .wordmark {
    margin-right: auto;
  }

  .primary-nav {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-header,
  .header-inner,
  .primary-nav a,
  .icon-button {
    transition-duration: 0.01ms;
  }

  .icon-button:hover {
    transform: none;
  }
}
</style>
