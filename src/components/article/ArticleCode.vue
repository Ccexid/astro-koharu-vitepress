<script setup lang="ts">
import { computed, h, ref, type VNodeChild } from 'vue'
import type { Element, Text } from 'hast'
import { articleLowlight } from '@/services/article-highlight'
const props = defineProps<{ code: string; language: string }>()
const status = ref('复制')
function renderToken(node: Element | Text): VNodeChild {
  return node.type === 'text'
    ? node.value
    : h(
        'span',
        { class: node.properties.className },
        node.children.map((child) => renderToken(child as Element | Text)),
      )
}
const tokens = computed(() =>
  props.language === 'plaintext' || !articleLowlight.registered(props.language)
    ? props.code
    : articleLowlight
        .highlight(props.language, props.code)
        .children.map((node) => renderToken(node as Element | Text)),
)
const HighlightedCode = () => h('code', {}, tokens.value)
async function copy() {
  try {
    await navigator.clipboard.writeText(props.code)
    status.value = '已复制'
  } catch {
    status.value = '复制失败，请选择代码复制'
  }
}
</script>
<template>
  <div class="article-code">
    <div class="code-caption">
      <span>{{ language }}</span
      ><button type="button" aria-live="polite" @click="copy">{{ status }}</button>
    </div>
    <pre tabindex="0" :aria-label="language + ' 代码'"><HighlightedCode /></pre>
  </div>
</template>
