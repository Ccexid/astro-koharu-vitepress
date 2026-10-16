import type { Post } from '@/types/post'
import type { ArticleNode } from '@/types/article'

const text = (value: string): ArticleNode => ({ type: 'text', text: value })
const p = (value: string): ArticleNode => ({ type: 'paragraph', content: [text(value)] })
const heading = (level: number, id: string, value: string): ArticleNode => ({
  type: 'heading',
  attrs: { level, id },
  content: [text(value)],
})
const cell = (value: string, header = false, align = 'left'): ArticleNode => ({
  type: header ? 'tableHeader' : 'tableCell',
  content: [{ ...p(value), attrs: { textAlign: align } }],
})

/** Original demonstration content; the sample picture reuses the documented existing cover. */
export const articleDemo: Post = {
  id: 'article-style-guide',
  slug: 'article-style-guide',
  title: '让文字有自己的形状',
  excerpt: '一篇可以边读边改的正文样式指南：从标题和列表，到代码、图片、表格与提示块。',
  publishedAt: '2026-10-16',
  category: { name: 'Vue', slug: 'frontend/vue' },
  tags: [{ name: '内容样式', slug: 'content-styles' }],
  readingMinutes: 1,
  cover: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=82',
  coverAlt: '蓝天下盛放的金黄色花朵',
  sections: [],
  contentVersion: 1,
  content: {
    type: 'doc',
    content: [
      heading(2, 'type-and-rhythm', '标题与文字的节奏'),
      p('好的排版让阅读自然发生。这里所有内容来自同一份 JSON，阅读页与编辑预览使用相同的渲染器。'),
      {
        type: 'paragraph',
        content: [
          text('你可以写下'),
          { ...text('重要的想法'), marks: [{ type: 'bold' }] },
          text('，保留一点'),
          { ...text('轻柔的语气'), marks: [{ type: 'italic' }] },
          text('，划去'),
          { ...text('不再适用的句子'), marks: [{ type: 'strike' }] },
          text('，或'),
          { ...text('标记值得回看的地方'), marks: [{ type: 'highlight' }] },
          text('。'),
        ],
      },
      heading(3, 'inline-details', '小处的强调'),
      {
        type: 'paragraph',
        content: [
          text('行内代码 '),
          { ...text('contentVersion: 1'), marks: [{ type: 'code' }] },
          text(' 与 '),
          { ...text('Vue 官方文档'), marks: [{ type: 'link', attrs: { href: 'https://vuejs.org/' } }] },
          text(' 都能融入正文。'),
        ],
      },
      heading(4, 'a-small-heading', '四级标题也有自己的位置'),
      p('层级用于组织信息，目录会随正文自动生成。'),
      heading(2, 'lists-and-quotes', '把想法整理成条目'),
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              p('先记录，再整理'),
              { type: 'bulletList', content: [{ type: 'listItem', content: [p('一个嵌套的观察')] }] },
            ],
          },
          { type: 'listItem', content: [p('留一点空白给明天')] },
        ],
      },
      {
        type: 'orderedList',
        attrs: { start: 1 },
        content: ['打开编辑页', '写作并查看真实预览', '导出 JSON，纳入仓库后重新部署'].map((value) => ({
          type: 'listItem',
          content: [p(value)],
        })),
      },
      {
        type: 'taskList',
        content: [
          { type: 'taskItem', attrs: { checked: true }, content: [p('完成正文的第一稿')] },
          {
            type: 'taskItem',
            attrs: { checked: false },
            content: [
              p('再读一遍，删去多余的话'),
              {
                type: 'taskList',
                content: [{ type: 'taskItem', attrs: { checked: false }, content: [p('检查图片替代文本')] }],
              },
            ],
          },
        ],
      },
      { type: 'blockquote', content: [p('写作不是填满一页，而是给一个想法找到恰当的位置。')] },
      heading(2, 'code-and-images', '代码与画面'),
      {
        type: 'codeBlock',
        attrs: { language: 'typescript' },
        content: [
          text(
            "interface Note {\n  title: string\n  contentVersion: 1\n}\n\nconst note: Note = {\n  title: '给春天留一页空白',\n  contentVersion: 1,\n}\nconsole.log(note.title)",
          ),
        ],
      },
      {
        type: 'image',
        attrs: {
          src: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=82',
          alt: '蓝天下盛放的金黄色花朵',
          caption: '让画面也参与叙事。点击图片查看大图。图片来源：Unsplash，沿用项目既有图片。',
        },
      },
      heading(2, 'tables', '需要比较时，用一张表'),
      {
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: [cell('内容', true), cell('状态', true, 'center'), cell('建议', true, 'right')],
          },
          {
            type: 'tableRow',
            content: [
              cell('本地草稿'),
              cell('自动保存', false, 'center'),
              cell('在同一浏览器恢复', false, 'right'),
            ],
          },
          {
            type: 'tableRow',
            content: [
              cell('文章 JSON'),
              cell('可导入导出', false, 'center'),
              cell('保留一份独立备份', false, 'right'),
            ],
          },
          {
            type: 'tableRow',
            content: [
              cell('线上发布'),
              cell('后续阶段', false, 'center'),
              cell('重新部署或接入发布服务', false, 'right'),
            ],
          },
        ],
      },
      heading(2, 'callouts', '给读者一个清晰的提示'),
      ...(['info', 'success', 'warning', 'error'] as const).map((kind, index): ArticleNode => ({
        type: 'callout',
        attrs: { kind },
        content: [
          p(
            [
              '信息：草稿只保存在当前浏览器，不会同步到其他设备。',
              '成功：导出的 JSON 可以重新导入，继续编辑。',
              '警告：清除站点数据会删除本地草稿，请定期导出备份。',
              '错误：图片或链接地址不安全时，导入会被拒绝，当前草稿不会被替换。',
            ][index]!,
          ),
        ],
      })),
      { type: 'horizontalRule' },
      p('到这里，基础内容类型就齐了。打开编辑页，可以把这篇指南变成你的第一篇文章。'),
    ],
  },
}
