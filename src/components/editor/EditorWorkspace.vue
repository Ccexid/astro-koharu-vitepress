<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { RouterLink, onBeforeRouteUpdate } from 'vue-router'
import { useArticleDraft } from '@/composables/useArticleDraft'
import { articleStats } from '@/services/article-content'
import { exportArticleFile, parseArticleFile } from '@/services/article-drafts'
import type { ArticleDraft } from '@/types/article'
import ArticleFields from './ArticleFields.vue'
import ArticlePreview from './ArticlePreview.vue'
import RichTextEditor from './RichTextEditor.vue'

const props = defineProps<{ sourceSlug: string }>()
const { store, ready, error, restored, editorKey, composing, invalidContent, dirty, save, load, replace } =
  useArticleDraft(props.sourceSlug)
const preview = ref(false)
const notice = ref('')
const fileInput = useTemplateRef('fileInput')
const stats = computed(() => articleStats(store.draft.content))
const savedTime = computed(() =>
  store.savedAt
    ? new Date(store.savedAt).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '',
)
function patch(fields: Partial<ArticleDraft>) {
  store.draft = { ...store.draft, ...fields }
}

async function importFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    if (file.size > 2_000_000) throw new Error('JSON 文件不能超过 2 MB。')
    const draft = parseArticleFile(await file.text())
    // Replacing the open document is destructive even if its last version has autosaved.
    if (!window.confirm('导入将替换当前工作区，并自动保存为本地草稿。继续前请确认已导出需要保留的内容。'))
      return
    replace(draft)
    preview.value = false
    notice.value = 'JSON 已导入。保存状态见上方提示。'
  } catch (reason) {
    notice.value = reason instanceof Error ? reason.message : '导入失败，当前草稿保持不变。'
  }
}
function exportFile() {
  try {
    const content = exportArticleFile(store.draft)
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    const filename = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(store.draft.slug) ? store.draft.slug : 'article-draft'
    anchor.download = `${filename}.json`
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    notice.value = '已导出 JSON 草稿。未完成的文章信息也已备份，不会线上发布。'
  } catch (reason) {
    notice.value = reason instanceof Error ? reason.message : '导出失败。'
  }
}
async function reload() {
  if (dirty.value && !window.confirm('重新载入会丢弃尚未保存的更改，请先导出需要保留的内容。确定继续吗？'))
    return
  await load()
}
onBeforeRouteUpdate(async () => {
  if (dirty.value) await save()
  if (dirty.value || composing.value) return window.confirm('更改尚未保存，确定切换文章吗？')
  return true
})
</script>
<template>
  <section class="editor-workspace" aria-label="本地文章编辑">
    <header class="editor-intro">
      <h1>把想法写下来</h1>
      <p>写作、预览，再带走一份属于你的文章。</p>
      <p class="editor-local-label">草稿仅保存在此浏览器。导出 JSON 可独立备份；这里的保存不会线上发布。</p>
    </header>
    <p v-if="error" class="editor-error" role="alert">
      {{ error }} <button type="button" @click="load()">重试读取草稿</button>
      <button type="button" @click="load(true)">临时编辑并导出备份</button>
    </p>
    <p v-else-if="!ready" role="status">正在打开本地草稿…</p>
    <template v-if="ready">
      <div class="editor-actions" role="group" aria-label="文章操作">
        <button type="button" class="editor-primary" :disabled="composing" @click="save">保存草稿</button>
        <button
          type="button"
          :aria-pressed="preview"
          :disabled="composing || invalidContent"
          @click="preview = !preview"
        >
          {{ preview ? '返回编辑' : '真实预览' }}
        </button>
        <button type="button" :disabled="composing" @click="fileInput?.click()">导入 JSON</button>
        <button type="button" :disabled="composing || invalidContent" @click="exportFile">导出 JSON</button>
        <button type="button" :disabled="composing" @click="reload">重新载入草稿</button>
        <input
          ref="fileInput"
          class="visually-hidden"
          type="file"
          accept=".json,application/json"
          aria-label="导入文章 JSON 文件"
          @change="importFile"
        />
      </div>
      <div class="editor-save-state" role="status" aria-live="polite">
        <span
          >{{ store.status }}<template v-if="savedTime"> · {{ savedTime }}</template></span
        ><span>{{ stats.wordCount }} 字 · {{ stats.readingMinutes }} 分钟阅读</span>
      </div>
      <p v-if="restored" class="editor-recovery">已自动恢复上次在此浏览器保存的内容，可以继续写作。</p>
      <p v-if="notice" class="editor-notice" role="status">{{ notice }}</p>
      <div v-show="!preview">
        <ArticleFields :draft="store.draft" @change="patch" @composition="composing = $event" />
        <h2 class="editor-body-label">正文</h2>
        <RichTextEditor
          :key="editorKey"
          :content="store.draft.content"
          @change="patch({ content: $event })"
          @composition="composing = $event"
          @validity="invalidContent = !$event"
        />
      </div>
      <ArticlePreview v-if="preview" :draft="store.draft" />
    </template>
    <nav class="editor-help-links" aria-label="编辑帮助">
      <RouterLink to="/posts/article-style-guide">阅读基础样式演示</RouterLink
      ><RouterLink to="/editor?post=article-style-guide">编辑演示文章</RouterLink
      ><RouterLink v-if="sourceSlug" to="/editor">新文章工作区</RouterLink
      ><RouterLink to="/posts">返回文章列表</RouterLink>
    </nav>
  </section>
</template>
