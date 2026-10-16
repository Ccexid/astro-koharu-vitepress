import type { ArticleDraft } from '@/types/article'
import { normalizeDraft } from './article-content'

export interface StoredDraft {
  key: string
  draft: ArticleDraft
  revision: number
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error('浏览器无法使用 IndexedDB，请导出 JSON 备份。'))
      return
    }
    const request = indexedDB.open('koharu-article-drafts', 1)
    let blocked = false
    request.onupgradeneeded = () => {
      request.result.createObjectStore('drafts', { keyPath: 'key' })
    }
    request.onsuccess = () => {
      if (blocked) {
        request.result.close()
        return
      }
      request.result.onversionchange = () => request.result.close()
      resolve(request.result)
    }
    request.onerror = () => reject(new Error('无法打开本地草稿，请检查站点存储权限并导出备份。'))
    request.onblocked = () => {
      blocked = true
      reject(new Error('草稿数据库被其他窗口占用，请关闭旧窗口后重试。'))
    }
  })
}

export async function loadArticleDraft(key: string): Promise<StoredDraft | null> {
  const db = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction('drafts', 'readonly')
      const request = transaction.objectStore('drafts').get(key)
      request.onsuccess = () => {
        try {
          const result = request.result as StoredDraft | undefined
          if (result && (result.key !== key || !Number.isSafeInteger(result.revision) || result.revision < 1))
            throw new Error('草稿记录格式不正确。')
          resolve(result ? { ...result, draft: normalizeDraft(result.draft, true) } : null)
        } catch {
          reject(new Error('草稿格式损坏，已保留原记录。请使用之前导出的 JSON 恢复。'))
        }
      }
      request.onerror = () => reject(new Error('读取草稿失败，请重试。'))
    })
  } finally {
    db.close()
  }
}

/** Compare revisions inside the write transaction, so two tabs cannot silently overwrite each other. */
export async function saveArticleDraft(
  key: string,
  draft: ArticleDraft,
  revision: number,
): Promise<StoredDraft> {
  const safeDraft = normalizeDraft(draft, true)
  const db = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction('drafts', 'readwrite')
      const store = transaction.objectStore('drafts')
      const request = store.get(key)
      const result: StoredDraft = { key, draft: safeDraft, revision: revision + 1 }
      let conflict = false
      request.onsuccess = () => {
        const stored = request.result as StoredDraft | undefined
        if ((stored?.revision || 0) !== revision) {
          conflict = true
          transaction.abort()
          return
        }
        store.put(result)
      }
      transaction.oncomplete = () => resolve(result)
      transaction.onabort = transaction.onerror = () =>
        reject(
          new Error(
            conflict
              ? '其他窗口已更新这份草稿。请先导出当前内容，再重新载入草稿。'
              : '保存失败，可能是空间不足或存储权限被关闭。请导出 JSON 备份。',
          ),
        )
    })
  } finally {
    db.close()
  }
}

export function parseArticleFile(text: string): ArticleDraft {
  if (text.length > 2_000_000 || new TextEncoder().encode(text).byteLength > 2_000_000)
    throw new Error('JSON 文件不能超过 2 MB。')
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw new Error('文件不是有效的 JSON。')
  }
  return normalizeDraft(value, true)
}

export function exportArticleFile(draft: ArticleDraft): string {
  const text = JSON.stringify(normalizeDraft(draft, true), null, 2)
  if (new TextEncoder().encode(text).byteLength > 2_000_000)
    throw new Error('导出内容超过 2 MB，请减少正文后重试。')
  return text
}
