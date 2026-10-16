<script setup lang="ts">
import { ref, watch } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import type { JSONContent } from '@tiptap/core'
import type { ArticleDocument } from '@/types/article'
import {
  calloutKinds,
  codeLanguages,
  normalizeArticleDocument,
  safeArticleUrl,
} from '@/services/article-content'
import { articleExtensions } from './extensions'

const props = defineProps<{ content: ArticleDocument }>()
const emit = defineEmits<{
  change: [content: ArticleDocument]
  composition: [active: boolean]
  validity: [valid: boolean]
}>()
const error = ref('')
const insertKind = ref<'link' | 'image' | ''>('')
const url = ref('')
const alt = ref('')
const caption = ref('')
function cancelInsert() {
  insertKind.value = ''
  error.value = ''
}
const composing = ref(false)
function update() {
  if (!editor.value || composing.value) return
  try {
    emit('change', normalizeArticleDocument(editor.value.getJSON()))
    emit('validity', true)
    error.value = ''
  } catch (reason) {
    emit('validity', false)
    error.value = reason instanceof Error ? reason.message : '内容格式不正确。'
  }
}
const editor = useEditor({
  content: props.content as JSONContent,
  extensions: articleExtensions(),
  editorProps: {
    attributes: {
      class: 'article-body editor-prose',
      'aria-label': '文章正文',
      role: 'textbox',
      'aria-multiline': 'true',
    },
    handleDOMEvents: {
      compositionstart: () => {
        composing.value = true
        emit('composition', true)
        return false
      },
      compositionend: () => {
        composing.value = false
        // Let ProseMirror finish its composition transaction before reading the document.
        setTimeout(() => {
          update()
          emit('composition', false)
        }, 0)
        return false
      },
    },
  },
  onUpdate: update,
})
watch(editor, (value) => {
  if (value) update()
})
function heading(event: Event) {
  const value = Number((event.target as HTMLSelectElement).value)
  if (value === 0) editor.value?.chain().focus().setParagraph().run()
  else
    editor.value
      ?.chain()
      .focus()
      .setHeading({ level: value as 2 | 3 | 4 })
      .run()
}
function language(event: Event) {
  editor.value
    ?.chain()
    .focus()
    .setCodeBlock({ language: (event.target as HTMLSelectElement).value })
    .run()
}
function callout(event: Event) {
  const kind = (event.target as HTMLSelectElement).value
  if (!kind) return
  if (editor.value?.isActive('callout'))
    editor.value.chain().focus().updateAttributes('callout', { kind }).run()
  else editor.value?.chain().focus().wrapIn('callout', { kind }).run()
  ;(event.target as HTMLSelectElement).value = ''
}
function openInsert(kind: 'link' | 'image') {
  insertKind.value = kind
  const attrs = editor.value?.getAttributes(kind) || {}
  url.value = String(kind === 'link' ? attrs.href || '' : attrs.src || '')
  alt.value = String(attrs.alt || '')
  caption.value = String(attrs.caption || '')
}
function insert() {
  const safeUrl = safeArticleUrl(url.value.trim(), insertKind.value === 'image')
  if (!safeUrl) {
    error.value = '请输入安全的 http(s) 地址或站内路径；链接还支持 mailto、tel 和 #锚点。'
    return
  }
  if (insertKind.value === 'link')
    editor.value?.chain().focus().extendMarkRange('link').setLink({ href: safeUrl }).run()
  else if (editor.value?.isActive('image'))
    editor.value
      .chain()
      .focus()
      .updateAttributes('image', { src: safeUrl, alt: alt.value, caption: caption.value })
      .run()
  else
    editor.value
      ?.chain()
      .focus()
      .insertContent({ type: 'image', attrs: { src: safeUrl, alt: alt.value, caption: caption.value } })
      .run()
  insertKind.value = ''
  error.value = ''
}
const marks = [
  { name: 'bold', label: '加粗', command: () => editor.value?.chain().focus().toggleBold().run() },
  { name: 'italic', label: '斜体', command: () => editor.value?.chain().focus().toggleItalic().run() },
  { name: 'strike', label: '删除线', command: () => editor.value?.chain().focus().toggleStrike().run() },
  { name: 'highlight', label: '高亮', command: () => editor.value?.chain().focus().toggleHighlight().run() },
  { name: 'code', label: '行内代码', command: () => editor.value?.chain().focus().toggleCode().run() },
  {
    name: 'bulletList',
    label: '无序列表',
    command: () => editor.value?.chain().focus().toggleBulletList().run(),
  },
  {
    name: 'orderedList',
    label: '有序列表',
    command: () => editor.value?.chain().focus().toggleOrderedList().run(),
  },
  {
    name: 'taskList',
    label: '任务列表',
    command: () => editor.value?.chain().focus().toggleTaskList().run(),
  },
  {
    name: 'blockquote',
    label: '引用',
    command: () => editor.value?.chain().focus().toggleBlockquote().run(),
  },
  {
    name: 'codeBlock',
    label: '代码块',
    command: () => editor.value?.chain().focus().toggleCodeBlock().run(),
  },
]
</script>
<template>
  <div v-if="editor" class="rich-editor">
    <div class="editor-toolbar" role="group" aria-label="正文格式">
      <select
        aria-label="段落样式"
        :value="editor.isActive('heading') ? editor.getAttributes('heading').level : 0"
        @change="heading"
      >
        <option :value="0">正文</option>
        <option :value="2">标题 H2</option>
        <option :value="3">标题 H3</option>
        <option :value="4">标题 H4</option>
      </select>
      <button
        v-for="mark in marks"
        :key="mark.name"
        type="button"
        :aria-pressed="editor.isActive(mark.name)"
        :disabled="composing"
        @mousedown.prevent
        @click="mark.command"
      >
        {{ mark.label }}
      </button>
      <button
        type="button"
        :disabled="!editor.can().undo()"
        @mousedown.prevent
        @click="editor.chain().focus().undo().run()"
      >
        撤销
      </button>
      <button
        type="button"
        :disabled="!editor.can().redo()"
        @mousedown.prevent
        @click="editor.chain().focus().redo().run()"
      >
        重做
      </button>
      <button type="button" @click="openInsert('link')">链接</button
      ><button
        type="button"
        :disabled="!editor.isActive('link')"
        @click="editor.chain().focus().unsetLink().run()"
      >
        取消链接
      </button>
      <button type="button" @click="openInsert('image')">图片与说明</button>
      <button type="button" @click="editor.chain().focus().setHorizontalRule().run()">分割线</button>
      <button
        type="button"
        :disabled="!editor.can().sinkListItem(editor.isActive('taskItem') ? 'taskItem' : 'listItem')"
        @click="
          editor
            .chain()
            .focus()
            .sinkListItem(editor.isActive('taskItem') ? 'taskItem' : 'listItem')
            .run()
        "
      >
        增加缩进
      </button>
      <button
        type="button"
        :disabled="!editor.can().liftListItem(editor.isActive('taskItem') ? 'taskItem' : 'listItem')"
        @click="
          editor
            .chain()
            .focus()
            .liftListItem(editor.isActive('taskItem') ? 'taskItem' : 'listItem')
            .run()
        "
      >
        减少缩进
      </button>
      <select
        aria-label="代码语言"
        :value="editor.getAttributes('codeBlock').language || 'plaintext'"
        :disabled="!editor.isActive('codeBlock')"
        @change="language"
      >
        <option v-for="lang in codeLanguages" :key="lang" :value="lang">{{ lang }}</option>
      </select>
      <select aria-label="添加提示块" @change="callout">
        <option value="">提示块…</option>
        <option v-for="(kind, index) in calloutKinds" :key="kind" :value="kind">
          {{ ['信息', '成功', '警告', '错误'][index] }}
        </option>
      </select>
      <button
        type="button"
        :disabled="!editor.isActive('callout')"
        @click="editor.chain().focus().lift('callout').run()"
      >
        移除提示块
      </button>
    </div>
    <details class="editor-table-tools">
      <summary>表格与对齐</summary>
      <div class="editor-toolbar" role="group" aria-label="表格与段落对齐">
        <button
          type="button"
          :disabled="editor.isActive('table')"
          @click="editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()"
        >
          插入表格
        </button>
        <button
          type="button"
          :disabled="!editor.isActive('table')"
          @click="editor.chain().focus().addRowAfter().run()"
        >
          增加行
        </button>
        <button
          type="button"
          :disabled="!editor.isActive('table')"
          @click="editor.chain().focus().addColumnAfter().run()"
        >
          增加列
        </button>
        <button
          type="button"
          :disabled="!editor.isActive('table')"
          @click="editor.chain().focus().deleteRow().run()"
        >
          删除行
        </button>
        <button
          type="button"
          :disabled="!editor.isActive('table')"
          @click="editor.chain().focus().deleteColumn().run()"
        >
          删除列
        </button>
        <button
          type="button"
          :disabled="!editor.isActive('table')"
          @click="editor.chain().focus().toggleHeaderRow().run()"
        >
          切换表头
        </button>
        <button
          type="button"
          :disabled="!editor.isActive('table')"
          @click="editor.chain().focus().deleteTable().run()"
        >
          删除表格
        </button>
        <button
          v-for="(align, index) in ['left', 'center', 'right']"
          :key="align"
          type="button"
          :aria-pressed="editor.isActive({ textAlign: align })"
          @click="editor.chain().focus().setTextAlign(align).run()"
        >
          {{ ['左对齐', '居中', '右对齐'][index] }}
        </button>
      </div>
    </details>
    <form v-if="insertKind" class="editor-insert-form" @submit.prevent="insert">
      <label
        >{{ insertKind === 'image' ? '图片地址' : '链接地址'
        }}<input v-model="url" type="text" maxlength="2048" required
      /></label>
      <template v-if="insertKind === 'image'"
        ><label>替代文本<input v-model="alt" maxlength="300" /></label
        ><label>图片说明<input v-model="caption" maxlength="500" /></label
      ></template>
      <button type="submit">应用</button><button type="button" @click="cancelInsert">取消</button>
    </form>
    <p v-if="error" class="editor-error" role="alert">{{ error }} 请修正或撤销后再保存。</p>
    <EditorContent :editor="editor" />
    <p class="editor-hint">
      列表中可用 Tab / Shift+Tab
      调整层级；支持常用格式快捷键。图片使用稳定地址，本地文件上传将在发布阶段接入。
    </p>
  </div>
</template>
