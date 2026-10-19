<script setup lang="ts">
import { computed, defineAsyncComponent, provide, ref, shallowRef, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import SiteHeader from '@/components/SiteHeader.vue'
import SiteHero from '@/components/SiteHero.vue'
import SiteSidebar from '@/components/SiteSidebar.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import FloatingTools from '@/components/FloatingTools.vue'
import MobileDrawer from '@/components/MobileDrawer.vue'
import { useTheme } from '@/composables/useTheme'
import { useReadingPosition } from '@/composables/useReadingPosition'
import { useSidebarData } from '@/composables/useSidebarData'
import { defaultSiteCover, siteCoverKey, type SiteCover } from '@/app/site-cover'
import { transitionKind } from '@/app/view-transitions'
const SettingsPanel = defineAsyncComponent(() => import('@/components/SettingsPanel.vue'))
const route = useRoute()
const { theme, toggleTheme } = useTheme()
const { stats, error: statsError, profileSocials, reloadStats } = useSidebarData()
const drawerOpen = ref(false)
const settingsOpen = ref(false)
const settingsMounted = ref(false)
function openSettings() {
  settingsMounted.value = true
  settingsOpen.value = true
}
const siteCover = shallowRef<SiteCover>(defaultSiteCover(route.path))
const { activeId, progress, scrolled, headerHidden } = useReadingPosition(siteCover)
const showRecommendations = computed(
  () =>
    siteCover.value.kind === 'not-found' || !/^\/(categories|tags|archives|editor)(\/|$)/.test(route.path),
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
  <div class="site" :class="{ 'is-post-list': route.path === '/posts', 'is-about': route.path === '/about' }">
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
      <SiteSidebar
        variant="drawer"
        :cover="siteCover"
        :active-id="activeId"
        :stats="stats"
        :stats-error="statsError"
        :profile-socials="profileSocials"
        @retry="reloadStats"
        @navigate="drawerOpen = false"
      />
    </MobileDrawer>
    <SettingsPanel v-if="settingsMounted" :open="settingsOpen" @close="settingsOpen = false" />
    <div class="content-shell">
      <SiteSidebar
        class="sidebar-column"
        :cover="siteCover"
        :active-id="activeId"
        :stats="stats"
        :stats-error="statsError"
        :profile-socials="profileSocials"
        @retry="reloadStats"
      />
      <div class="main-column">
        <main id="main-content" class="site-main page-content" tabindex="-1">
          <div class="route-stage">
            <RouterView v-slot="{ Component }">
              <Transition
                name="page"
                :css="transitionKind !== 'route'"
                @before-enter="(element) => element.removeAttribute('inert')"
                @before-leave="(element) => element.setAttribute('inert', '')"
                @leave-cancelled="(element) => element.removeAttribute('inert')"
              >
                <div :key="route.path"><component :is="Component" /></div>
              </Transition>
            </RouterView>
          </div>
        </main>
        <SiteFooter
          :page-key="route.path"
          :show-recommendations="showRecommendations"
          :article-slug="siteCover.kind === 'article' ? String(route.params.slug) : undefined"
        />
      </div>
    </div>
    <FloatingTools
      v-if="route.path !== '/editor'"
      :reading="siteCover.kind === 'article'"
      :progress="progress"
      @open-settings="openSettings"
    />
  </div>
</template>
