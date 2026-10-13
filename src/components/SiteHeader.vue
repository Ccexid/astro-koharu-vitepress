<script setup lang="ts">
import { ref, watch } from 'vue'
import { Menu, X } from 'lucide-vue-next'
import { RouterLink, useRoute } from 'vue-router'
import type { Theme } from '../composables/useTheme'

defineProps<{ theme: Theme }>()
const emit = defineEmits<{ toggleTheme: [origin: HTMLElement] }>()
const menuOpen = ref(false)
const route = useRoute()

const links = [
  { label: '首页', to: '/' },
  { label: '文章', to: '/posts' },
  { label: '分类', to: '/categories' },
  { label: '标签', to: '/tags' },
  { label: '归档', to: '/archives' },
  { label: '友链', to: '/friends' },
  { label: '关于', to: '/about' },
]

function closeMenu() {
  menuOpen.value = false
}

function handleThemeToggle(event: MouseEvent) {
  if (event.currentTarget instanceof HTMLElement) {
    emit('toggleTheme', event.currentTarget)
  }
}

watch(() => route.fullPath, closeMenu)
</script>

<template>
  <header class="site-header">
    <div class="header-inner">
      <button
        class="icon-button menu-toggle"
        type="button"
        :aria-label="menuOpen ? '关闭导航菜单' : '打开导航菜单'"
        :aria-expanded="menuOpen"
        aria-controls="site-navigation"
        @click="menuOpen = !menuOpen"
      >
        <X v-if="menuOpen" :size="20" aria-hidden="true" />
        <Menu v-else :size="20" aria-hidden="true" />
      </button>

      <RouterLink class="wordmark" to="/" aria-label="Koharu 首页" @click="closeMenu">
        <span class="wordmark-mark" aria-hidden="true">花</span>
        <span>Koharu</span>
      </RouterLink>

      <nav
        id="site-navigation"
        class="primary-nav"
        :class="{ 'is-open': menuOpen }"
        aria-label="主导航"
      >
        <RouterLink
          v-for="(link, index) in links"
          :key="link.to"
          :to="link.to"
          :exact-active-class="link.to === '/' ? 'is-active' : ''"
          active-class="is-active"
          :style="{ '--nav-delay': `${index * 20}ms` }"
          @click="closeMenu"
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
  z-index: 5;
  top: 0;
  right: 0;
  left: 0;
  color: #fff;
}

.header-inner {
  width: min(100% - 48px, 1280px);
  min-height: 74px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 32px;
  border-bottom: 1px solid rgb(255 255 255 / 24%);
}

.wordmark {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  flex: 0 0 auto;
  color: inherit;
  font-size: 1.25rem;
  font-weight: 750;
  text-decoration: none;
}

.wordmark-mark {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 75%);
  border-radius: 50%;
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 15px;
  font-weight: 600;
}

.primary-nav {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
  flex: 1;
}

.primary-nav a {
  padding: 9px 11px;
  border-radius: 4px;
  color: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
}

.primary-nav a.is-active {
  background: rgb(255 255 255 / 19%);
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
}

.menu-toggle {
  display: none;
}

@media (max-width: 820px) {
  .header-inner {
    width: min(100% - 32px, 1280px);
    min-height: 66px;
    justify-content: space-between;
    gap: 14px;
  }

  .menu-toggle {
    display: inline-grid;
    order: 0;
  }

  .wordmark {
    margin-right: auto;
    font-size: 1.15rem;
  }

  .primary-nav {
    position: absolute;
    top: 72px;
    right: 16px;
    left: 16px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: stretch;
    padding: 9px;
    border: 1px solid rgb(255 255 255 / 32%);
    border-radius: 6px;
    background: rgb(40 31 39 / 92%);
    box-shadow: 0 16px 34px rgb(31 24 30 / 18%);
    opacity: 0;
    transform: translateY(-7px) scale(0.99);
    transform-origin: top right;
    visibility: hidden;
    pointer-events: none;
    transition:
      opacity 180ms var(--motion-ease-hover),
      transform 180ms var(--motion-ease-hover),
      visibility 0s linear 180ms;
  }

  .primary-nav.is-open {
    opacity: 1;
    transform: none;
    visibility: visible;
    pointer-events: auto;
    transition:
      opacity var(--motion-duration-menu) var(--motion-ease-enter),
      transform var(--motion-duration-menu) var(--motion-ease-enter),
      visibility 0s;
  }

  .primary-nav a {
    padding: 12px;
    opacity: 0;
    transform: translateX(-6px);
    transition:
      opacity 180ms var(--motion-ease-hover),
      transform 180ms var(--motion-ease-hover);
    transition-delay: 0ms;
  }

  .primary-nav.is-open a {
    opacity: 1;
    transform: none;
    transition:
      opacity var(--motion-duration-base) var(--motion-ease-enter),
      transform var(--motion-duration-base) var(--motion-ease-enter);
    transition-delay: calc(60ms + var(--nav-delay, 0ms));
  }
}

@media (hover: hover) and (pointer: fine) {
  .primary-nav a:hover {
    background: rgb(255 255 255 / 19%);
  }

  .icon-button {
    transition:
      background-color 160ms ease,
      transform 160ms ease;
  }

  .icon-button:hover {
    background: rgb(42 31 39 / 36%);
    transform: translateY(-1px);
  }
}

@media (hover: hover) and (pointer: fine) and (min-width: 821px) {
  .primary-nav a {
    transition: background-color 160ms ease;
  }
}

@media (prefers-reduced-motion: reduce) {
  .icon-button:hover {
    transform: none;
  }
}

@media (max-width: 820px) and (prefers-reduced-motion: reduce) {
  .primary-nav,
  .primary-nav.is-open {
    transform: none;
    transition:
      opacity 0.01ms linear,
      visibility 0s linear 0.01ms;
  }

  .primary-nav.is-open {
    transition:
      opacity 0.01ms linear,
      visibility 0s;
  }

  .primary-nav a,
  .primary-nav.is-open a {
    transform: none;
    transition:
      opacity 0.01ms linear,
      background-color 0s;
    transition-delay: 0ms;
  }
}
</style>
