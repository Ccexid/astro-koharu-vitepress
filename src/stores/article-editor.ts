import { defineStore } from 'pinia'
import { ref } from 'vue'
import { emptyDraft } from '@/services/article-content'

/** Only the active editor state lives here. IndexedDB owns persistent drafts. */
export const useArticleEditorStore = defineStore('article-editor', () => {
  const draft = ref(emptyDraft())
  const status = ref('正在打开草稿…')
  const savedAt = ref('')
  return { draft, status, savedAt }
})
