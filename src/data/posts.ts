import { demoPosts } from './demo-posts'
import { categoryCatalog } from './categories'
import { collectPublishedPosts } from '@/services/article-publication'

// Raw JSON keeps the byte-size and schema checks identical in Vite and the publishing CLI.
const articles = import.meta.glob<string>('./articles/*.json', {
  eager: true,
  query: '?raw',
  import: 'default',
})

export const posts = collectPublishedPosts(demoPosts, articles, categoryCatalog)
