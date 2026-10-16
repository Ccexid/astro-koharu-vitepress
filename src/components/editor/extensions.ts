import { Node, mergeAttributes } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Highlight from '@tiptap/extension-highlight'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { TableKit } from '@tiptap/extension-table'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import TextAlign from '@tiptap/extension-text-align'
import UniqueID from '@tiptap/extension-unique-id'
import { articleLowlight } from '@/services/article-highlight'
import { safeArticleUrl } from '@/services/article-content'

const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  addAttributes() {
    return { kind: { default: 'info', parseHTML: (element) => element.dataset.kind } }
  },
  parseHTML() {
    return [{ tag: 'aside[data-kind]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'aside',
      mergeAttributes({ class: 'article-callout', 'data-kind': HTMLAttributes.kind }, HTMLAttributes),
      0,
    ]
  },
})
const CaptionImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
        parseHTML: (element) => safeArticleUrl(element.getAttribute('src'), true) || null,
      },
      caption: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-caption'),
        renderHTML: (attrs) => ({ 'data-caption': attrs.caption }),
      },
    }
  },
  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (element) => (safeArticleUrl(element.getAttribute('src'), true) ? null : false),
      },
    ]
  },
})

export function articleExtensions() {
  return [
    StarterKit.configure({
      codeBlock: false,
      heading: { levels: [2, 3, 4] },
      link: { openOnClick: false, isAllowedUri: (url) => !!safeArticleUrl(url) },
    }),
    Highlight,
    CaptionImage.configure({ allowBase64: false }),
    CodeBlockLowlight.configure({ lowlight: articleLowlight, defaultLanguage: 'plaintext' }),
    TableKit.configure({ table: { resizable: false } }),
    TaskList,
    TaskItem.configure({ nested: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left', 'center', 'right'] }),
    UniqueID.configure({
      types: ['heading'],
      attributeName: 'id',
      generateID: () => `heading-${crypto.randomUUID()}`,
    }),
    Callout,
  ]
}
