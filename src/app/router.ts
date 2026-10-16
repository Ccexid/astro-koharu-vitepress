import { createRouter, createWebHistory } from 'vue-router'
import { getCategory, getPost, getTag } from '@/services/posts'
import { cancelPostTransition } from '@/composables/usePostTransition'
import { cancelViewTransition, transitionKind } from '@/app/view-transitions'

const HomePage = () => import('@/pages/HomePage.vue')
const PostsPage = () => import('@/pages/PostsPage.vue')
const PostPage = () => import('@/pages/PostPage.vue')
const TaxonomyIndexPage = () => import('@/pages/TaxonomyIndexPage.vue')
const TaxonomyDetailPage = () => import('@/pages/TaxonomyDetailPage.vue')
const ArchivesPage = () => import('@/pages/ArchivesPage.vue')
const BangumiPage = () => import('@/pages/BangumiPage.vue')
const FriendsPage = () => import('@/pages/FriendsPage.vue')
const AboutPage = () => import('@/pages/AboutPage.vue')
const NotFoundPage = () => import('@/pages/NotFoundPage.vue')

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
    { path: '/editor', component: () => import('@/pages/EditorPage.vue') },
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

router.beforeEach((to) => {
  if (transitionKind.value === 'theme') cancelViewTransition()
  cancelPostTransition(to.path)
})

const pageTitles: Record<string, string> = {
  '/': '一封春日来信',
  '/posts': '所有文章',
  '/editor': '本地文章编辑',
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
