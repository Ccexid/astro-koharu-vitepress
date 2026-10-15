import { createRouter, createWebHistory } from 'vue-router'
import ArchivesPage from '../pages/ArchivesPage.vue'
import FriendsPage from '../pages/FriendsPage.vue'
import NotFoundPage from '../pages/NotFoundPage.vue'
import PostsPage from '../pages/PostsPage.vue'
import HomePage from '../pages/HomePage.vue'
import PostPage from '../pages/PostPage.vue'
import TaxonomyDetailPage from '../pages/TaxonomyDetailPage.vue'
import TaxonomyIndexPage from '../pages/TaxonomyIndexPage.vue'
import AboutPage from '../pages/AboutPage.vue'
import BangumiPage from '../pages/BangumiPage.vue'
import { getCategory, getPost, getTag } from '@/services/posts'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: decodeURIComponent(to.hash), top: 96, behavior: 'smooth' }
    return { top: 0 }
  },
  routes: [
    { path: '/', component: HomePage },
    { path: '/posts', component: PostsPage },
    { path: '/posts/:slug', component: PostPage, props: true },
    { path: '/categories', component: TaxonomyIndexPage, props: { kind: 'category' } },
    {
      path: '/categories/:slug(.*)',
      component: TaxonomyDetailPage,
      props: (route) => ({ kind: 'category', slug: String(route.params.slug) }),
    },
    { path: '/tags', component: TaxonomyIndexPage, props: { kind: 'tag' } },
    {
      path: '/tags/:slug',
      component: TaxonomyDetailPage,
      props: (route) => ({ kind: 'tag', slug: String(route.params.slug) }),
    },
    { path: '/archives', component: ArchivesPage },
    { path: '/bangumi', component: BangumiPage },
    { path: '/friends', component: FriendsPage },
    { path: '/about', component: AboutPage },
    { path: '/:pathMatch(.*)*', component: NotFoundPage },
  ],
})

const pageTitles: Record<string, string> = {
  '/': '一封春日来信',
  '/posts': '所有文章',
  '/categories': '文章分类',
  '/tags': '文章标签',
  '/archives': '时光归档',
  '/bangumi': '追番记录',
  '/friends': '友人来信',
  '/about': '关于',
}

router.afterEach(async (to) => {
  let title = pageTitles[to.path]
  if (!title && to.path.startsWith('/posts/')) {
    title =
      (await getPost(Array.isArray(to.params.slug) ? to.params.slug.join('/') : String(to.params.slug)))
        ?.title || '文章不存在'
  }
  if (!title && to.path.startsWith('/categories/')) {
    title =
      (await getCategory(Array.isArray(to.params.slug) ? to.params.slug.join('/') : String(to.params.slug)))
        ?.name || '分类不存在'
  }
  if (!title && to.path.startsWith('/tags/')) {
    title =
      (await getTag(Array.isArray(to.params.slug) ? to.params.slug.join('/') : String(to.params.slug)))
        ?.name || '标签不存在'
  }
  document.title = `${title ?? '页面不存在'} · Koharu`
})
