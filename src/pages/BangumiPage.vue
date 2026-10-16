<script setup lang="ts">
import { computed, ref } from 'vue'
import CollectionPanel from '@/components/bangumi/CollectionPanel.vue'
import type { CollectionSource } from '@/types/bangumi'
import { useSettingsStore } from '@/stores/settings'

const sources: Array<{ id: CollectionSource; label: string }> = [
  { id: 'bilibili', label: '哔哩哔哩' },
  { id: 'bangumi', label: 'Bangumi.tv' },
]
const source = ref<CollectionSource>('bilibili')
const settings = useSettingsStore()
const userId = computed(() =>
  String(source.value === 'bangumi' ? settings.bangumiUserId : settings.bilibiliUid).trim(),
)
function switchWithKeyboard(event: KeyboardEvent, index: number) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? sources.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + sources.length) % sources.length
  source.value = sources[next]!.id
  document.getElementById('collection-tab-' + source.value)?.focus()
}
</script>
<template>
  <div class="collection-source-tabs" role="tablist" aria-label="追番数据来源">
    <button
      v-for="(item, index) in sources"
      :id="'collection-tab-' + item.id"
      :key="item.id"
      type="button"
      role="tab"
      :aria-selected="source === item.id"
      aria-controls="collection-panel"
      :tabindex="source === item.id ? 0 : -1"
      @click="source = item.id"
      @keydown="switchWithKeyboard($event, index)"
    >
      {{ item.label }}
    </button>
  </div>
  <div id="collection-panel" role="tabpanel" :aria-labelledby="'collection-tab-' + source">
    <CollectionPanel :key="source + ':' + userId" :source="source" :user-id="userId" />
  </div>
</template>
<style scoped>
.collection-source-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 26px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
}
.collection-source-tabs button {
  min-height: 44px;
  padding: 9px 20px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--muted);
  font: inherit;
}
.collection-source-tabs button[aria-selected='true'] {
  background: var(--petal-soft);
  color: var(--petal-deep);
}
</style>
