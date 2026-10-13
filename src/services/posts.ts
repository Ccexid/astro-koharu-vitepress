import { posts } from '../data/posts'
import type { Post } from '../types/post'

export async function listPosts(): Promise<Post[]> {
  return posts.map((post) => ({ ...post, body: [...post.body] }))
}

export async function getPost(slug: string): Promise<Post | null> {
  const post = posts.find((item) => item.slug === slug)
  return post ? { ...post, body: [...post.body] } : null
}
