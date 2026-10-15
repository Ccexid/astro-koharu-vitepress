<script setup lang="ts">
import { ref } from 'vue'
import { BookOpen, Github } from 'lucide-vue-next'
import LinkPreview from '@/components/LinkPreview.vue'
import { useScrollReveal } from '@/composables/useScrollReveal'
const content = ref<HTMLElement | null>(null)
useScrollReveal(content, () => true, '.about-content > :is(h2, h3, p, blockquote, .about-links)')
</script>
<template>
  <article ref="content" class="about-content">
    <h2>你好，这里是春日来信</h2>
    <p>Koharu，一本关于生活与创作的小小手记。</p>
    <p>愿我们一直保有好奇，也愿平凡的日子值得被认真记下。</p>
    <blockquote>慢慢走，认真看。<br />把微小的光，写成自己的故事。</blockquote>
    <p>
      这里写散步时的发现、阅读留下的念头，也记录构建网页时慢慢想通的问题。文章按分类、标签与时间整理，你可以从感兴趣的主题开始。
    </p>
    <h3 id="contact">找到我</h3>
    <p>这是博客前端模板的演示作者资料。用于真实站点时，请替换成自己的姓名、头像和联系方式。</p>
    <div class="about-links">
      <LinkPreview
        href="/posts"
        domain="春日来信"
        title="读一封来信"
        description="从最近写下的文章开始，阅读生活、创作与构建网页时留下的记录。"
      >
        <template #icon><BookOpen :size="16" aria-hidden="true" /></template>
      </LinkPreview>
      <LinkPreview
        href="https://github.com/cosZone/astro-koharu"
        domain="github.com"
        title="参考主题 · astro-koharu"
        description="cosZone / astro-koharu：本小站布局与阅读体验的视觉参考。"
      >
        <template #icon><Github :size="16" aria-hidden="true" /></template>
      </LinkPreview>
    </div>
    <h3>关于这个小站</h3>
    <p>
      使用 Vue 3、Vite 与 TypeScript 重新实现 Koharu 的阅读体验。文章和友链是本地演示数据，追番展示哔哩哔哩与
      Bangumi.tv 的公开收藏。
    </p>
  </article>
</template>
