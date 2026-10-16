<script setup lang="ts">
import { computed, h, type VNodeChild } from 'vue'
import type { ArticleDocument, ArticleNode } from '@/types/article'
import { articleText, normalizeArticleDocument } from '@/services/article-content'
import ArticleCode from './ArticleCode.vue'
import ArticleImage from './ArticleImage.vue'
const props = defineProps<{ content: ArticleDocument }>()
const result = computed(() => {
  try {
    return { doc: normalizeArticleDocument(props.content), error: '' }
  } catch (error) {
    return { doc: null, error: error instanceof Error ? error.message : '正文格式不正确。' }
  }
})
const calloutLabels: Record<string, string> = {
  info: '信息',
  success: '成功',
  warning: '警告',
  error: '错误',
}
function render(node: ArticleNode): VNodeChild {
  const attrs = node.attrs || {}
  const children = () => (node.content || []).map(render)
  if (node.type === 'text') {
    let text: VNodeChild = node.text || ''
    for (const mark of node.marks || []) {
      const tags = {
        bold: 'strong',
        italic: 'em',
        underline: 'u',
        strike: 's',
        highlight: 'mark',
        code: 'code',
        link: 'a',
      }
      text = h(
        tags[mark.type],
        mark.type === 'link' ? { href: mark.attrs?.href, rel: 'noopener noreferrer' } : {},
        [text],
      )
    }
    return text
  }
  if (node.type === 'heading')
    return h(`h${attrs.level}`, { id: attrs.id, style: { textAlign: attrs.textAlign } }, [
      ...children(),
      h(
        'a',
        { href: `#${attrs.id}`, class: 'heading-anchor', 'aria-label': `链接到 ${articleText(node)}` },
        '#',
      ),
    ])
  if (node.type === 'image')
    return h(ArticleImage, {
      src: String(attrs.src),
      alt: String(attrs.alt || ''),
      caption: String(attrs.caption || ''),
    })
  if (node.type === 'codeBlock')
    return h(ArticleCode, { code: articleText(node), language: String(attrs.language) })
  if (node.type === 'table')
    return h(
      'div',
      { class: 'article-table-scroll', tabindex: 0, role: 'region', 'aria-label': '正文表格，可横向滚动' },
      [h('table', {}, [h('tbody', {}, children())])],
    )
  if (node.type === 'tableCell' || node.type === 'tableHeader')
    return h(
      node.type === 'tableHeader' ? 'th' : 'td',
      { colspan: attrs.colspan, rowspan: attrs.rowspan },
      children(),
    )
  if (node.type === 'taskItem')
    return h('li', { 'data-type': 'taskItem' }, [
      h('input', {
        type: 'checkbox',
        checked: attrs.checked,
        disabled: true,
        'aria-label': articleText(node),
      }),
      h('div', {}, children()),
    ])
  if (node.type === 'callout')
    return h('aside', { class: 'article-callout', 'data-kind': attrs.kind }, [
      h('strong', {}, calloutLabels[String(attrs.kind)]),
      ...children(),
    ])
  const tags: Record<string, string> = {
    paragraph: 'p',
    blockquote: 'blockquote',
    bulletList: 'ul',
    orderedList: 'ol',
    listItem: 'li',
    taskList: 'ul',
    tableRow: 'tr',
    hardBreak: 'br',
    horizontalRule: 'hr',
  }
  return h(
    tags[node.type] || 'div',
    {
      ...(node.type === 'orderedList' ? { start: attrs.start } : {}),
      ...(node.type === 'taskList' ? { 'data-type': 'taskList' } : {}),
      ...(node.type === 'paragraph' ? { style: { textAlign: attrs.textAlign } } : {}),
    },
    children(),
  )
}
const Body = () => h('div', { class: 'article-body' }, result.value.doc?.content.map(render))
</script>
<template>
  <p v-if="result.error" class="status-message" role="alert">正文无法显示：{{ result.error }}</p>
  <Body v-else />
</template>
