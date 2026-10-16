import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { checkArticles, publishArticle, readArticleFiles } from '../scripts/articles'
import { articleDemo } from '../src/data/article-demo'
import { categoryCatalog } from '../src/data/categories'
import { demoPosts } from '../src/data/demo-posts'
import { draftFromPost, emptyDraft } from '../src/services/article-content'
import { exportArticleFile } from '../src/services/article-drafts'
import { collectPublishedPosts, parsePublishedArticle } from '../src/services/article-publication'

function article() {
  return {
    ...draftFromPost(articleDemo),
    id: 'published-test',
    slug: 'published-test',
    title: '本地发布验证',
  }
}

describe('publication validation', () => {
  it('accepts editor exports and replaces a demo by stable ID without mutating it', () => {
    const draft = { ...draftFromPost(articleDemo), title: '更新后的样式文章' }
    const posts = collectPublishedPosts(
      demoPosts,
      { 'article.json': exportArticleFile(draft) },
      categoryCatalog,
    )
    expect(posts).toHaveLength(demoPosts.length)
    expect(posts.find((post) => post.id === articleDemo.id)?.title).toBe(draft.title)
    expect(articleDemo.title).not.toBe(draft.title)
    expect(parsePublishedArticle(exportArticleFile(draft), categoryCatalog)).toEqual(draft)
  })

  it.each([
    { title: '' },
    { id: '' },
    { id: 'x'.repeat(161) },
    { slug: '../escape' },
    { slug: 'x'.repeat(121) },
    { excerpt: ' ' },
    { publishedAt: '2026-02-30' },
    { contentVersion: 2 },
    { updatedAt: undefined },
    { updatedAt: 'invalid' },
    { category: { name: '不存在', slug: 'unknown' } },
    { category: { name: '错误名称', slug: 'essays' } },
    { cover: 'javascript:alert(1)' },
    { content: { type: 'doc', content: [{ type: 'paragraph' }] } },
    { content: { type: 'doc', content: [{ type: 'script' }] } },
  ])('rejects incomplete, inconsistent or unsafe publication metadata %#', (patch) => {
    expect(() => parsePublishedArticle(JSON.stringify({ ...article(), ...patch }), categoryCatalog)).toThrow()
  })

  it('allows unfinished draft backups but refuses their publication', () => {
    const text = exportArticleFile(emptyDraft())
    expect(() => parsePublishedArticle(text, categoryCatalog)).toThrow()
    expect(() => parsePublishedArticle('invalid json', categoryCatalog)).toThrow('有效的 JSON')
    expect(() => parsePublishedArticle(' '.repeat(2_000_001), categoryCatalog)).toThrow('2 MB')
    expect(() => parsePublishedArticle('春'.repeat(700_000), categoryCatalog)).toThrow('2 MB')
  })

  it('reports both sources for duplicate IDs and rejects slug collisions with JSON or demos', () => {
    const draft = article()
    expect(() =>
      collectPublishedPosts(
        demoPosts,
        {
          'first.json': JSON.stringify(draft),
          'second.json': JSON.stringify(draft),
        },
        categoryCatalog,
      ),
    ).toThrow(/second.json:.*first.json/)
    for (const slug of [articleDemo.slug, draft.slug]) {
      expect(() =>
        collectPublishedPosts(
          demoPosts,
          {
            'first.json': JSON.stringify(draft),
            'second.json': JSON.stringify({ ...draft, id: 'another-id', slug }),
          },
          categoryCatalog,
        ),
      ).toThrow('slug')
    }
  })
})

describe('local publication transaction', () => {
  let root: string
  let directory: string
  let source: string
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'koharu-publish-'))
    directory = join(root, 'src/data/articles')
    source = join(root, '导出的文章.json')
    await mkdir(directory, { recursive: true })
    await writeFile(source, exportArticleFile(article()))
  })
  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  it('discovers additions and updates the same file by ID even when slug changes', async () => {
    const verify = vi.fn(async () => {
      expect((await checkArticles(root)).posts.some((post) => post.id === article().id)).toBe(true)
    })
    const added = await publishArticle(source, root, verify)
    expect(added.updated).toBe(false)
    const updated = { ...article(), title: '更新正文', slug: 'new-address' }
    await writeFile(source, exportArticleFile(updated))
    const result = await publishArticle(source, root, verify)
    expect(result).toEqual({ filename: added.filename, slug: 'new-address', updated: true })
    expect(await readdir(directory)).toEqual([added.filename])
    expect(JSON.parse(await readFile(join(directory, added.filename), 'utf8'))).toEqual(updated)
    expect(verify).toHaveBeenCalledTimes(2)
  })

  it('rejects a conflicting ID/slug before changing files or starting checks', async () => {
    await publishArticle(source, root, () => {})
    const before = await readArticleFiles(root)
    await writeFile(source, exportArticleFile({ ...article(), id: 'different-id' }))
    const verify = vi.fn()
    await expect(publishArticle(source, root, verify)).rejects.toThrow()
    expect(await readArticleFiles(root)).toEqual(before)
    expect(verify).not.toHaveBeenCalled()
  })

  it('does not overwrite a filename that only differs by case on Windows', async () => {
    await writeFile(
      join(directory, 'ARTICLE-published-test.json'),
      exportArticleFile({
        ...article(),
        id: 'another-id',
        slug: 'another-address',
      }),
    )
    await expect(publishArticle(source, root, () => {})).rejects.toThrow('占用')
  })

  it.each([false, true])(
    'rolls back failed checks, including exact original formatting (existing=%s)',
    async (existing) => {
      const filename = 'article-published-test.json'
      const previous = JSON.stringify({ ...article(), title: '原始版本' })
      if (existing) await writeFile(join(directory, filename), previous)
      await expect(
        publishArticle(source, root, () => {
          throw new Error('build failed')
        }),
      ).rejects.toThrow('已恢复')
      expect(await readdir(directory)).toEqual(existing ? [filename] : [])
      if (existing) expect(await readFile(join(directory, filename), 'utf8')).toBe(previous)
    },
  )

  it('preserves external edits made while failed checks were running', async () => {
    const target = join(directory, 'article-published-test.json')
    await expect(
      publishArticle(source, root, async () => {
        await writeFile(target, 'external edit')
        throw new Error('failed')
      }),
    ).rejects.toThrow('外部修改')
    expect(await readFile(target, 'utf8')).toBe('external edit')
    expect((await readdir(directory)).some((name) => name.endsWith('.lock'))).toBe(false)
  })

  it('blocks concurrent publishers and reports uppercase JSON files instead of silently skipping them', async () => {
    await writeFile(join(directory, '.article-publish.lock'), '')
    await expect(publishArticle(source, root, () => {})).rejects.toThrow('另一个发布命令')
    await writeFile(join(directory, 'invalid.JSON'), '{}')
    await expect(checkArticles(root)).rejects.toThrow('小写 .json')
  })
})
