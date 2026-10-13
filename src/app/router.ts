import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import PostPage from '../pages/PostPage.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: HomePage },
    { path: '/posts/:slug', component: PostPage, props: true },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
