import { describe, expect, it } from 'vitest'
import { getSchema } from '@tiptap/core'
import { articleExtensions } from '../src/components/editor/extensions'
import { articleDemo } from '../src/data/article-demo'
import {
  articleHeadings,
  articleStats,
  draftFromPost,
  legacySectionsToDocument,
  normalizeArticleDocument,
  normalizeDraft,
  postDocument,
  safeArticleUrl,
} from '../src/services/article-content'
import { exportArticleFile, parseArticleFile } from '../src/services/article-drafts'
import { getPost } from '../src/services/posts'

describe('versioned article content', () => {
  it('converts legacy sections without losing existing heading anchors or text', async () => {
    const post = (await getPost('a-note-for-spring'))!
    const doc = legacySectionsToDocument(post.sections)
    expect(articleHeadings(doc).map((heading) => heading.id)).toEqual(
      post.sections.map((section) => section.id),
    )
    expect(articleStats(doc).wordCount).toBeGreaterThan(20)
    expect(post.content).toEqual(doc)
    expect(post.readingMinutes).toBe(articleStats(doc).readingMinutes)
  })
  it('round-trips every demonstration node through the actual editor schema and JSON export', () => {
    const draft = draftFromPost(articleDemo)
    const schema = getSchema(articleExtensions())
    const node = schema.nodeFromJSON(draft.content)
    expect(() => node.check()).not.toThrow()
    const roundTrip = normalizeArticleDocument(node.toJSON())
    expect(roundTrip).toEqual(draft.content)
    const imported = parseArticleFile(exportArticleFile(draft))
    expect(imported).toEqual(draft)
    expect(articleHeadings(roundTrip).map((heading) => heading.level)).toContain(4)
    expect(articleStats(roundTrip)).toEqual(articleStats(draft.content))
  })
  it('assigns unique anchors and preserves valid explicit IDs', () => {
    const doc = normalizeArticleDocument({
      type: 'doc',
      content: [2, 3, 4].map((level) => ({
        type: 'heading',
        attrs: { level, id: 'same' },
        content: [{ type: 'text', text: '标题' }],
      })),
    })
    expect(articleHeadings(doc).map((heading) => heading.id)).toEqual(['same', 'same-2', 'same-3'])
    expect(normalizeArticleDocument(doc)).toEqual(doc)
  })
  it.each([
    'javascript:alert(1)',
    'data:text/html,x',
    '//evil.test/a',
    '/\\evil.test',
    ' https://example.com',
    'https://example.com\n/a',
  ])('rejects unsafe URL %s', (url) => {
    expect(safeArticleUrl(url)).toBe('')
    expect(safeArticleUrl(url, true)).toBe('')
  })
  it('allows explicit web, contact and local links but restricts images', () => {
    for (const url of [
      'https://example.com/a',
      '/images/photo.jpg',
      '#old-heading',
      'mailto:hello@example.com',
      'tel:+12345',
    ])
      expect(safeArticleUrl(url)).toBe(url)
    expect(safeArticleUrl('mailto:a@example.com', true)).toBe('')
  })
  it.each([
    { type: 'script' },
    { type: 'doc', content: [{ type: 'tableCell' }] },
    { type: 'doc', content: [{ type: 'heading', attrs: { level: 1 } }] },
    { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'image', attrs: { src: '/a.png' } }] }] },
    { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }] },
    { type: 'doc', content: [{ type: 'image', attrs: { src: 'javascript:alert(1)' } }] },
    {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'unsafe',
              marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
            },
          ],
        },
      ],
    },
  ])('rejects malformed or unsupported content %#', (doc) =>
    expect(() => normalizeArticleDocument(doc)).toThrow(),
  )
  it('discards arbitrary attributes and treats HTML as escaped text, not executable content', () => {
    const doc = normalizeArticleDocument({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { onclick: 'alert(1)', style: 'color:red' },
          content: [{ type: 'text', text: '<script>alert(1)</script>' }],
        },
      ],
    })
    expect(doc.content[0]!.attrs).toEqual({ textAlign: 'left' })
    expect(doc.content[0]!.content![0]!.text).toBe('<script>alert(1)</script>')
  })
  it('rejects deep content, unsupported versions, invalid dates and oversized imports', () => {
    let nested: unknown = { type: 'paragraph' }
    for (let i = 0; i < 26; i++) nested = { type: 'blockquote', content: [nested] }
    expect(() => normalizeArticleDocument({ type: 'doc', content: [nested] })).toThrow('嵌套')
    const draft = draftFromPost(articleDemo)
    expect(() => normalizeDraft({ ...draft, contentVersion: 2 })).toThrow('版本')
    for (const publishedAt of ['2026-02-30', '2026-99-99'])
      expect(() => normalizeDraft({ ...draft, publishedAt })).toThrow('日期')
    expect(() => parseArticleFile(' '.repeat(2_000_001))).toThrow('2 MB')
    expect(() => parseArticleFile('bad json')).toThrow('有效')
  })
  it('counts Chinese characters and Latin words consistently across inline formats', () => {
    const doc = normalizeArticleDocument({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '春天 hello ' },
            { type: 'text', text: 'world', marks: [{ type: 'bold' }] },
          ],
        },
      ],
    })
    expect(articleStats(doc)).toEqual({ wordCount: 4, readingMinutes: 1 })
    expect(postDocument(articleDemo).type).toBe('doc')
  })
  it('counts words on both sides of an explicit line break separately', () => {
    const doc = normalizeArticleDocument({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'hello' }, { type: 'hardBreak' }, { type: 'text', text: 'world' }],
        },
      ],
    })
    expect(articleStats(doc).wordCount).toBe(2)
  })
  it('rejects duplicate marks that would produce deeply nested renderer elements', () => {
    expect(() =>
      normalizeArticleDocument({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'text', marks: [{ type: 'bold' }, { type: 'bold' }] }],
          },
        ],
      }),
    ).toThrow('重复')
  })
})
