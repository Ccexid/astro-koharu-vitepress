<script setup lang="ts">
import { ref } from 'vue'
import { ArrowUp, ArrowDown, Pointer, PartyPopper } from 'lucide-vue-next'
defineProps<{ reading: boolean; progress: number }>()
const collapsed = ref(false)
function scroll(bottom: boolean) {
  window.scrollTo({
    top: bottom ? document.documentElement.scrollHeight : 0,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  })
}
</script>
<template>
  <aside class="floating-tools" aria-label="页面工具">
    <template v-if="!collapsed"
      ><span v-if="reading" class="floating-progress" aria-label="阅读进度">{{ progress }}%</span
      ><button type="button" aria-label="回到顶部" @click="scroll(false)"><ArrowUp :size="18" /></button
      ><button type="button" aria-label="滚到底部" @click="scroll(true)"><ArrowDown :size="18" /></button
    ></template>
    <button
      type="button"
      :aria-label="collapsed ? '展开工具栏' : '收起工具栏'"
      :aria-expanded="!collapsed"
      @click="collapsed = !collapsed"
    >
      <PartyPopper v-if="collapsed" :size="18" /><Pointer v-else :size="18" />
    </button>
  </aside>
</template>
