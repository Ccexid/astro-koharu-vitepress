<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { RouterLink, useRoute } from 'vue-router'
import { isNavigationActive, siteNavigation } from '@/app/navigation'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement | null>(null)
const route = useRoute()

async function syncDialog(open: boolean) {
  await nextTick()
  const element = dialog.value
  if (!element) return

  if (open && !element.open) element.showModal()
  else if (!open && element.open) element.close()
}

function close() {
  emit('close')
}

function handleCancel(event: Event) {
  event.preventDefault()
  close()
}

function handleDialogClick(event: MouseEvent) {
  if (event.target === dialog.value) close()
}

watch(() => props.open, syncDialog, { immediate: true })
watch(() => route.fullPath, close)
</script>

<template>
  <dialog
    id="mobile-drawer"
    ref="dialog"
    class="drawer-dialog"
    aria-labelledby="drawer-title"
    @cancel="handleCancel"
    @click="handleDialogClick"
  >
    <div class="drawer-surface">
      <header class="drawer-header">
        <h2 id="drawer-title">导航与漫游</h2>
        <button class="drawer-close" type="button" aria-label="关闭导航抽屉" autofocus @click="close">
          <X :size="19" aria-hidden="true" />
        </button>
      </header>
      <nav class="drawer-nav" aria-label="站点导航">
        <RouterLink
          v-for="link in siteNavigation"
          :key="link.to"
          :to="link.to"
          :class="{ 'is-active': isNavigationActive(route.path, link.to) }"
          @click="close"
        >
          {{ link.label }}
        </RouterLink>
      </nav>
      <div class="drawer-content">
        <slot />
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.drawer-dialog {
  position: fixed;
  inset-block: 0;
  inset-inline: auto 0;
  width: min(88vw, 390px);
  height: 100dvh;
  max-height: 100dvh;
  margin: 0;
  padding: 0;
  overflow: visible;
  border: 0;
  background: transparent;
  color: var(--ink);
}

.drawer-dialog::backdrop {
  background: rgb(34 23 31 / 46%);
}

.drawer-surface {
  display: flex;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  background: var(--surface);
  box-shadow: var(--shadow-drawer);
}

.drawer-header {
  display: flex;
  min-height: 66px;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--line);
}

.drawer-header h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 650;
}

.drawer-close {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: var(--surface);
  color: var(--ink);
}

.drawer-nav {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--line);
}

.drawer-nav a {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  color: var(--ink);
  font-size: var(--text-sm);
  text-decoration: none;
}

.drawer-nav a.is-active {
  background: var(--petal-soft);
  color: var(--petal-deep);
}

.drawer-content {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: var(--space-4);
}

@media (prefers-reduced-motion: no-preference) {
  .drawer-dialog[open] .drawer-surface {
    animation: drawer-enter 240ms var(--motion-ease-enter) both;
  }

  .drawer-dialog[open]::backdrop {
    animation: drawer-backdrop 180ms ease-out both;
  }
}

@keyframes drawer-enter {
  from {
    opacity: 0.8;
    translate: 16px 0;
  }
}

@keyframes drawer-backdrop {
  from {
    background-color: rgb(34 23 31 / 0%);
  }
}
</style>
