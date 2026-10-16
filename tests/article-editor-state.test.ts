import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { effectScope, nextTick, type EffectScope } from 'vue'
import { useArticleDraft } from '../src/composables/useArticleDraft'
import { loadArticleDraft, saveArticleDraft } from '../src/services/article-drafts'

const hooks = vi.hoisted(() => ({ leave: null as null | (() => Promise<boolean>) }))
// These tests exercise the state machine; browser lifecycle and actual storage are checked separately.
vi.mock('vue', async (original) => ({
  ...(await original<typeof import('vue')>()),
  onMounted: vi.fn(),
  onBeforeUnmount: vi.fn(),
}))
vi.mock('vue-router', () => ({
  onBeforeRouteLeave: (guard: () => Promise<boolean>) => {
    hooks.leave = guard
  },
}))
vi.mock('../src/services/article-drafts', () => ({ loadArticleDraft: vi.fn(), saveArticleDraft: vi.fn() }))
let scope: EffectScope

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('window', { confirm: vi.fn(() => false) })
  vi.mocked(loadArticleDraft).mockResolvedValue(null)
  vi.mocked(saveArticleDraft).mockImplementation(async (key, draft, revision) => ({
    key,
    draft,
    revision: revision + 1,
  }))
  setActivePinia(createPinia())
  scope = effectScope()
})
afterEach(() => {
  scope.stop()
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.resetAllMocks()
  vi.unstubAllGlobals()
})

describe('article editor save state', () => {
  it('waits for composition to finish before autosaving Chinese input', async () => {
    const editor = scope.run(() => useArticleDraft(''))!
    await editor.load()
    editor.composing.value = true
    editor.store.draft.title = '正在输入中文'
    await vi.advanceTimersByTimeAsync(1600)
    expect(saveArticleDraft).not.toHaveBeenCalled()
    editor.composing.value = false
    await nextTick()
    await vi.advanceTimersByTimeAsync(800)
    expect(saveArticleDraft).toHaveBeenCalledOnce()
    expect(vi.mocked(saveArticleDraft).mock.calls[0]![1].title).toBe('正在输入中文')
    expect(editor.dirty.value).toBe(false)
  })
  it('keeps invalid visible edits unsaved and blocks leaving without confirmation', async () => {
    const editor = scope.run(() => useArticleDraft(''))!
    await editor.load()
    editor.invalidContent.value = true
    await nextTick()
    await editor.save()
    expect(saveArticleDraft).not.toHaveBeenCalled()
    expect(editor.dirty.value).toBe(true)
    expect(await hooks.leave!()).toBe(false)
    expect(window.confirm).toHaveBeenCalledOnce()
    editor.store.draft.title = '修正后的内容'
    editor.invalidContent.value = false
    await nextTick()
    await editor.save()
    expect(editor.dirty.value).toBe(false)
  })
  it('retains unsaved changes after storage failure and supports retry', async () => {
    const editor = scope.run(() => useArticleDraft(''))!
    await editor.load()
    vi.mocked(saveArticleDraft).mockRejectedValueOnce(new Error('空间不足，请导出备份。'))
    editor.store.draft.title = '不能丢失的文章'
    await editor.save()
    expect(editor.dirty.value).toBe(true)
    expect(editor.store.status).toContain('空间不足')
    await editor.save()
    expect(editor.dirty.value).toBe(false)
    expect(editor.store.draft.title).toBe('不能丢失的文章')
    expect(editor.store.status).toBe('已保存到此浏览器')
  })
})
