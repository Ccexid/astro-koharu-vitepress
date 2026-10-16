<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ArticleDraft } from '@/types/article'
const props = defineProps<{ draft: ArticleDraft }>()
const emit = defineEmits<{
  change: [patch: Partial<ArticleDraft>]
  composition: [active: boolean]
}>()
const tags = ref(formatTags(props.draft.tags))
function formatTags(items: ArticleDraft['tags']) {
  return items.map((tag) => `${tag.name}:${tag.slug}`).join(', ')
}
watch(
  () => props.draft.tags,
  (items) => {
    // Keep the text being typed (including a trailing comma), while accepting imports and reloads.
    if (JSON.stringify(items) !== JSON.stringify(parseTags(tags.value))) tags.value = formatTags(items)
  },
)
function value(event: Event) {
  return (event.target as HTMLInputElement).value
}
function parseTags(text: string): ArticleDraft['tags'] {
  return text
    .split(/[,，]/)
    .filter((item) => item.trim())
    .slice(0, 30)
    .map((item) => {
      const [name = '', slug = ''] = item.split(':')
      return { name: name.trim(), slug: slug.trim() }
    })
}
function setTags(event: Event) {
  tags.value = value(event)
  emit('change', { tags: parseTags(tags.value) })
}
</script>
<template>
  <div
    class="article-fields"
    @compositionstart="emit('composition', true)"
    @compositionend="emit('composition', false)"
  >
    <label class="field-wide"
      >文章标题<input
        :value="draft.title"
        class="editor-title-input"
        maxlength="160"
        placeholder="给这个想法起一个名字"
        @input="emit('change', { title: value($event) })"
    /></label>
    <label class="field-wide"
      >摘要<textarea
        :value="draft.excerpt"
        rows="2"
        maxlength="500"
        placeholder="用一两句话，邀请读者打开这篇文章。"
        @input="emit('change', { excerpt: value($event) })"
      />
    </label>
    <details class="field-wide editor-metadata">
      <summary>文章信息与封面</summary>
      <div class="article-fields">
        <label
          >文章 slug<input
            :value="draft.slug"
            placeholder="a-note-for-spring"
            maxlength="120"
            @input="emit('change', { slug: value($event) })"
          /><small>小写英文、数字和连字符</small></label
        >
        <label
          >文章日期<input
            :value="draft.publishedAt"
            type="date"
            @input="emit('change', { publishedAt: value($event) })"
        /></label>
        <label
          >分类名称<input
            :value="draft.category.name"
            maxlength="50"
            @input="emit('change', { category: { ...draft.category, name: value($event) } })"
        /></label>
        <label
          >分类 slug<input
            :value="draft.category.slug"
            placeholder="frontend/vue"
            maxlength="120"
            @input="emit('change', { category: { ...draft.category, slug: value($event) } })"
        /></label>
        <label class="field-wide"
          >标签（名称:slug，逗号分隔）<input
            :value="tags"
            placeholder="写作:writing, 日常:everyday"
            @input="setTags"
        /></label>
        <label class="field-wide"
          >封面地址<input
            :value="draft.cover"
            type="text"
            maxlength="2048"
            placeholder="https://… 或 /images/…"
            @input="emit('change', { cover: value($event) })"
        /></label>
        <label class="field-wide"
          >封面替代文本<input
            :value="draft.coverAlt"
            maxlength="300"
            @input="emit('change', { coverAlt: value($event) })"
        /></label>
        <label class="editor-checkbox"
          ><input
            :checked="draft.pinned"
            type="checkbox"
            @change="emit('change', { pinned: ($event.target as HTMLInputElement).checked })"
          />置顶文章</label
        >
      </div>
    </details>
  </div>
</template>
