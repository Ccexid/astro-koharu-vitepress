<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  Archive,
  ChevronDown,
  Flower2,
  FolderOpen,
  Hash,
  Home,
  Link,
  Info,
  Tv,
  BookOpen,
} from 'lucide-vue-next'
import type { Theme } from '@/composables/useTheme'
import type { SiteCover } from '@/app/site-cover'
import ArticleToc from '@/components/post/ArticleToc.vue'
const props = defineProps<{
  theme: Theme
  cover: SiteCover
  activeId: string
  progress: number
  scrolled: boolean
  hidden: boolean
}>()
const drawerOpen = defineModel<boolean>('drawerOpen', { default: false })
const emit = defineEmits<{ toggleTheme: [origin: HTMLElement] }>()
const route = useRoute()
const mobileToc = ref<HTMLDetailsElement | null>(null)
const article = computed(() => props.cover.kind === 'article')
const activeTitle = computed(
  () => props.cover.sections?.find((section) => section.id === props.activeId)?.title || props.cover.title,
)
function toggle(event: MouseEvent) {
  if (event.currentTarget instanceof HTMLElement) emit('toggleTheme', event.currentTarget)
}
function closeMenu(event: MouseEvent) {
  ;(event.currentTarget as HTMLElement).closest('details')?.removeAttribute('open')
}
</script>
<template>
  <header
    class="site-header"
    :class="{ 'is-scrolled': scrolled, 'is-hidden': hidden, 'is-reading': article }"
  >
    <div class="header-inner">
      <button
        class="header-menu icon-button"
        type="button"
        :aria-label="drawerOpen ? '关闭导航' : '打开导航'"
        :aria-expanded="drawerOpen"
        aria-controls="mobile-drawer"
        @click="drawerOpen = !drawerOpen"
      >
        <span class="menu-lines" :class="{ open: drawerOpen }" aria-hidden="true"></span>
      </button>
      <RouterLink class="wordmark" to="/" aria-label="Koharu 首页"
        ><Flower2 :size="25" aria-hidden="true" /><span>Koharu</span></RouterLink
      >
      <details v-if="article" ref="mobileToc" class="mobile-reading-nav">
        <summary>
          <span class="reading-percent">{{ progress }}%</span
          ><span>{{ scrolled ? activeTitle : '文章目录' }}</span
          ><ChevronDown :size="15" aria-hidden="true" />
        </summary>
        <div class="mobile-toc-panel">
          <ArticleToc
            :sections="cover.sections || []"
            :active-id="activeId"
            @navigate="mobileToc?.removeAttribute('open')"
          />
        </div>
      </details>
      <nav class="primary-nav" aria-label="主导航">
        <RouterLink to="/" :aria-current="route.path === '/' ? 'page' : undefined"
          ><Home :size="15" aria-hidden="true" />首页</RouterLink
        >
        <details class="header-dropdown">
          <summary>
            <BookOpen :size="15" aria-hidden="true" />文章<ChevronDown :size="13" aria-hidden="true" />
          </summary>
          <div class="header-dropdown-menu" @click="closeMenu">
            <RouterLink to="/posts"><BookOpen :size="15" />所有文章</RouterLink
            ><RouterLink to="/categories"><FolderOpen :size="15" />分类</RouterLink
            ><RouterLink to="/tags"><Hash :size="15" />标签</RouterLink
            ><RouterLink to="/archives"><Archive :size="15" />归档</RouterLink>
          </div>
        </details>
        <RouterLink to="/friends"><Link :size="15" aria-hidden="true" />友链</RouterLink>
        <RouterLink to="/about"><Info :size="15" aria-hidden="true" />关于</RouterLink>
        <RouterLink to="/bangumi"><Tv :size="15" aria-hidden="true" />追番</RouterLink>
      </nav>
      <button
        class="icon-button theme-toggle"
        type="button"
        :aria-label="theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'"
        :aria-pressed="theme === 'dark'"
        @click="toggle"
      >
        <span class="theme-toggle-icon" aria-hidden="true"><span class="theme-toggle-indicator" /></span>
      </button>
    </div>
  </header>
</template>
<style scoped>
.site-header {
  position: fixed;
  inset: 0 0 auto;
  z-index: 30;
  color: #fff;
  transition: translate 300ms var(--motion-ease-enter);
}
.site-header.is-hidden {
  translate: 0 -110%;
}
.header-inner {
  display: flex;
  width: min(100%, 1280px);
  min-height: 66px;
  padding: 0 30px;
  margin: auto;
  align-items: center;
  gap: 28px;
  transition:
    background-color 260ms,
    box-shadow 260ms;
}
.is-scrolled .header-inner {
  margin-top: 8px;
  min-height: 54px;
  border-radius: 28px;
  background: var(--surface);
  color: var(--ink);
  box-shadow: var(--shadow-header);
}
.wordmark {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  text-decoration: none;
  color: inherit;
  font-size: 1.3rem;
  font-weight: 700;
}
.primary-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}
.primary-nav a,
.header-dropdown summary {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 10px;
  color: inherit;
  font-size: 0.9rem;
  text-decoration: none;
  border-radius: 22px;
  cursor: pointer;
}
.primary-nav a:hover,
.header-dropdown summary:hover {
  background: rgb(255 255 255 / 18%);
}
.is-scrolled .primary-nav a:hover {
  background: var(--petal-soft);
  color: var(--petal-deep);
}
.header-dropdown {
  position: relative;
}
.header-dropdown summary {
  list-style: none;
}
.header-dropdown summary::-webkit-details-marker {
  display: none;
}
.header-dropdown-menu {
  position: absolute;
  top: 100%;
  width: 150px;
  padding: 7px;
  border-radius: 12px;
  background: var(--surface);
  color: var(--ink);
  box-shadow: var(--shadow-drawer);
}
.header-dropdown-menu a:hover {
  color: var(--petal-deep);
  background: var(--petal-soft);
}
.icon-button {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: rgb(255 255 255 / 14%);
  color: inherit;
  flex: 0 0 auto;
}
.header-menu,
.mobile-reading-nav {
  display: none;
}
.menu-lines,
.menu-lines::before,
.menu-lines::after {
  display: block;
  width: 18px;
  height: 2px;
  border-radius: 2px;
  background: currentColor;
  transition:
    rotate 180ms,
    translate 180ms;
}
.menu-lines {
  position: relative;
}
.menu-lines::before,
.menu-lines::after {
  content: '';
  position: absolute;
}
.menu-lines::before {
  top: -6px;
}
.menu-lines::after {
  top: 6px;
}
.menu-lines.open {
  rotate: 45deg;
}
.menu-lines.open::before {
  top: 0;
  rotate: 90deg;
}
.menu-lines.open::after {
  opacity: 0;
}
@media (max-width: 992px) {
  .header-inner {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) 44px;
    padding: 0 12px;
    gap: 10px;
    min-height: 56px;
  }
  .is-scrolled .header-inner {
    margin-top: 0;
    border-radius: 0;
    min-height: 56px;
  }
  .primary-nav {
    display: none;
  }
  .header-menu {
    display: grid;
  }
  .wordmark {
    justify-self: center;
  }
  .wordmark svg {
    display: none;
  }
  .mobile-reading-nav {
    display: block;
    position: relative;
    min-width: 0;
    grid-column: 2;
    grid-row: 1;
  }
  .is-reading .wordmark {
    display: none;
  }
  .is-reading.site-header.is-hidden {
    translate: none;
  }
  .mobile-reading-nav summary {
    display: flex;
    gap: 7px;
    align-items: center;
    justify-content: center;
    list-style: none;
    min-height: 44px;
    cursor: pointer;
  }
  .mobile-reading-nav summary > span:nth-child(2) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.85rem;
  }
  .reading-percent {
    font-size: 0.65rem;
    border: 1px solid currentColor;
    padding: 5px;
    border-radius: 50%;
  }
  .mobile-toc-panel {
    position: absolute;
    top: calc(100% + 4px);
    left: -54px;
    right: -54px;
    max-height: 60svh;
    overflow: auto;
    padding: 16px;
    background: var(--surface);
    color: var(--ink);
    box-shadow: var(--shadow-drawer);
  }
}
</style>
