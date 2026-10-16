<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ExternalLink } from 'lucide-vue-next'

const props = defineProps<{ href: string; domain: string; title: string; description: string }>()
const internal = computed(() => props.href.startsWith('/'))
const attributes = computed(() =>
  internal.value ? { to: props.href } : { href: props.href, target: '_blank', rel: 'noopener noreferrer' },
)
</script>
<template>
  <component :is="internal ? RouterLink : 'a'" v-bind="attributes" class="link-preview">
    <span class="link-preview-domain"><slot name="icon" />{{ domain }}</span>
    <span class="link-preview-title">{{ title }}</span>
    <span class="link-preview-description">{{ description }}</span>
    <span class="link-preview-url"
      ><span>{{ href }}</span
      ><ExternalLink :size="12" aria-hidden="true"
    /></span>
  </component>
</template>
<style scoped>
.link-preview {
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  color: var(--ink);
  text-decoration: none;
  transition:
    border-color var(--motion-duration-base),
    box-shadow var(--motion-duration-base);
}
.link-preview-domain {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--muted);
  font-size: 0.75rem;
  line-height: 1rem;
  font-weight: 500;
}
.link-preview-domain :slotted(svg) {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
.link-preview-title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  margin-bottom: 8px;
  font-size: 1rem;
  line-height: 1.25rem;
  font-weight: 600;
}
.link-preview-description {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  margin-bottom: 12px;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--muted);
}
.link-preview-url {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 4px;
  color: var(--petal-deep);
  font-size: 0.75rem;
  line-height: 1rem;
}
.link-preview-url > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.link-preview-url > svg {
  flex-shrink: 0;
}
.link-preview:focus-visible {
  outline: 2px solid var(--petal);
  outline-offset: 3px;
}
@media (hover: hover) and (pointer: fine) {
  .link-preview:hover {
    border-color: color-mix(in srgb, var(--petal) 50%, var(--line));
    box-shadow: 0 4px 12px rgb(52 45 51 / 10%);
  }
}
</style>
