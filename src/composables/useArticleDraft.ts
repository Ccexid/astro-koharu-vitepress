import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useArticleEditorStore } from '@/stores/article-editor'
import { draftFromPost, emptyDraft } from '@/services/article-content'
import { loadArticleDraft, saveArticleDraft } from '@/services/article-drafts'
import { getPost } from '@/services/posts'
import type { ArticleDraft } from '@/types/article'

export function useArticleDraft(sourceSlug: string) {
  const store = useArticleEditorStore()
  const ready = ref(false)
  const error = ref('')
  const restored = ref(false)
  const editorKey = ref(0)
  const composing = ref(false)
  const invalidContent = ref(false)
  const persistent = ref(true)
  const snapshot = ref('')
  const key = sourceSlug ? `post:${sourceSlug}` : 'new'
  let revision = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let active = true
  let saving = Promise.resolve()
  const dirty = computed(
    () => ready.value && (invalidContent.value || JSON.stringify(store.draft) !== snapshot.value),
  )

  async function load(transient = false) {
    clearTimeout(timer)
    await saving
    ready.value = false
    error.value = ''
    try {
      const stored = transient ? null : await loadArticleDraft(key)
      const post = !stored && sourceSlug ? await getPost(sourceSlug) : null
      if (sourceSlug && !stored && !post) throw new Error('找不到原文章，请从文章列表重新进入。')
      if (!active) return
      store.draft = stored?.draft || (post ? draftFromPost(post) : emptyDraft())
      revision = stored?.revision || 0
      snapshot.value = JSON.stringify(store.draft)
      restored.value = !!stored
      store.savedAt = stored?.draft.updatedAt || ''
      store.status = stored ? '已恢复本地草稿' : '尚未保存'
      invalidContent.value = false
      persistent.value = !transient
      if (transient) store.status = '存储不可用，请导出 JSON 备份'
      editorKey.value++
      ready.value = true
    } catch (reason) {
      if (!active) return
      error.value = reason instanceof Error ? reason.message : '打开草稿失败。'
    }
  }

  function save() {
    clearTimeout(timer)
    saving = saving.then(async () => {
      if (!ready.value || composing.value || !active) return
      if (invalidContent.value) {
        store.status = '正文格式暂不能保存，请修正或撤销。'
        return
      }
      if (!persistent.value) {
        store.status = '存储不可用，请导出 JSON 备份'
        return
      }
      const current = JSON.stringify(store.draft)
      const draft: ArticleDraft = JSON.parse(current)
      draft.updatedAt = new Date().toISOString()
      store.status = '正在保存…'
      try {
        const result = await saveArticleDraft(key, draft, revision)
        if (!active) return
        revision = result.revision
        snapshot.value = current
        store.savedAt = draft.updatedAt
        store.status = dirty.value ? '有更改待保存' : '已保存到此浏览器'
      } catch (reason) {
        if (active) store.status = reason instanceof Error ? reason.message : '保存失败，请导出备份。'
      }
    })
    return saving
  }

  function scheduleSave() {
    clearTimeout(timer)
    if (!dirty.value || composing.value) return
    store.status = '有更改待保存'
    timer = setTimeout(() => {
      void save()
    }, 800)
  }
  watch(() => store.draft, scheduleSave, { deep: true, flush: 'sync' })
  watch(composing, (value) => {
    if (!value) scheduleSave()
  })
  watch(invalidContent, (value) => {
    if (value) {
      clearTimeout(timer)
      store.status = '正文格式暂不能保存，请修正或撤销。'
    } else scheduleSave()
  })

  function replace(draft: ArticleDraft) {
    invalidContent.value = false
    store.draft = draft
    editorKey.value++
    restored.value = false
    scheduleSave()
  }
  function beforeUnload(event: BeforeUnloadEvent) {
    if (dirty.value || composing.value) {
      event.preventDefault()
      event.returnValue = ''
    }
  }
  function visibilityChange() {
    if (document.visibilityState === 'hidden' && dirty.value) void save()
  }
  onBeforeRouteLeave(async () => {
    if (dirty.value && !composing.value) await save()
    if (dirty.value || composing.value)
      return window.confirm('当前更改尚未保存。离开会丢失这些更改，确定离开吗？')
    return true
  })
  onMounted(() => {
    void load()
    window.addEventListener('beforeunload', beforeUnload)
    document.addEventListener('visibilitychange', visibilityChange)
  })
  onBeforeUnmount(() => {
    active = false
    clearTimeout(timer)
    window.removeEventListener('beforeunload', beforeUnload)
    document.removeEventListener('visibilitychange', visibilityChange)
  })
  return { store, ready, error, restored, editorKey, composing, invalidContent, dirty, save, load, replace }
}
