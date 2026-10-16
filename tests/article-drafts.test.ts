import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { draftFromPost, emptyDraft, postFromDraft } from '../src/services/article-content'
import { articleDemo } from '../src/data/article-demo'
import {
  exportArticleFile,
  loadArticleDraft,
  parseArticleFile,
  saveArticleDraft,
} from '../src/services/article-drafts'

beforeEach(() => vi.stubGlobal('indexedDB', new IDBFactory()))
afterEach(() => vi.unstubAllGlobals())

describe('IndexedDB article drafts', () => {
  it('preserves unfinished metadata on save and restores a detached copy', async () => {
    const draft = emptyDraft()
    draft.title = '还没写完'
    draft.slug = 'unfinished slug'
    expect(await loadArticleDraft('new')).toBeNull()
    await saveArticleDraft('new', draft, 0)
    draft.title = 'not saved'
    const restored = await loadArticleDraft('new')
    expect(restored!.draft.title).toBe('还没写完')
    expect(restored!.draft.slug).toBe('unfinished slug')
    expect(parseArticleFile(exportArticleFile(restored!.draft))).toEqual(restored!.draft)
    expect(() => postFromDraft(restored!.draft)).toThrow('slug')
  })
  it('backs up a new article before its title, slug or category has been completed', () => {
    const draft = emptyDraft()
    draft.category = { name: '', slug: '' }
    draft.content = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: '先把想法记下来' }] }],
    }
    const restored = parseArticleFile(exportArticleFile(draft))
    expect(restored.title).toBe('')
    expect(restored.slug).toBe('')
    expect(restored.content.content[0]!.content![0]!.text).toBe('先把想法记下来')
    expect(() => postFromDraft(restored)).toThrow('标题')
  })
  it('still rejects unsafe cover URLs in unfinished draft imports', () => {
    const input = { ...emptyDraft(), cover: 'javascript:alert(1)' }
    expect(() => parseArticleFile(JSON.stringify(input))).toThrow('封面')
  })
  it('reports damaged revision metadata and preserves the stored record', async () => {
    await saveArticleDraft('new', emptyDraft(), 0)
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('koharu-article-drafts', 1)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction('drafts', 'readwrite')
        transaction.objectStore('drafts').put({ key: 'new', draft: emptyDraft(), revision: 'damaged' })
        transaction.oncomplete = () => {
          db.close()
          resolve()
        }
        transaction.onabort = () => {
          db.close()
          reject(transaction.error)
        }
      }
    })
    await expect(loadArticleDraft('new')).rejects.toThrow('已保留原记录')
    await expect(saveArticleDraft('new', emptyDraft(), 0)).rejects.toThrow('其他窗口')
  })
  it('rejects stale concurrent writes and leaves the latest saved version intact', async () => {
    const original = draftFromPost(articleDemo)
    const saved = await saveArticleDraft('demo', original, 0)
    const writes = await Promise.allSettled([
      saveArticleDraft('demo', { ...original, title: 'window A' }, saved.revision),
      saveArticleDraft('demo', { ...original, title: 'window B' }, saved.revision),
    ])
    expect(writes.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(writes.filter((result) => result.status === 'rejected')).toHaveLength(1)
    expect((await loadArticleDraft('demo'))!.revision).toBe(2)
  })
  it('keeps each original article in its own draft slot', async () => {
    await saveArticleDraft('a', draftFromPost(articleDemo), 0)
    await saveArticleDraft('b', { ...draftFromPost(articleDemo), title: 'another article' }, 0)
    expect((await loadArticleDraft('a'))!.draft.title).toBe(articleDemo.title)
    expect((await loadArticleDraft('b'))!.draft.title).toBe('another article')
  })
  it('reports unavailable storage and rejects invalid document data', async () => {
    vi.stubGlobal('indexedDB', undefined)
    await expect(loadArticleDraft('new')).rejects.toThrow('IndexedDB')
    await expect(
      saveArticleDraft('new', { ...draftFromPost(articleDemo), contentVersion: 2 } as never, 0),
    ).rejects.toThrow('版本')
  })
})
