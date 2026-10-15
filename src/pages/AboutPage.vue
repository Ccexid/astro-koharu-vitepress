<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { BookOpen, Github, ArrowUpRight } from 'lucide-vue-next'
</script>
<template>
  <article class="about-content">
    <h2>你好，这里是春日来信</h2>
    <p>Koharu，一本关于生活与创作的小小手记。</p>
    <p>愿我们一直保有好奇，也愿平凡的日子值得被认真记下。</p>
    <blockquote>慢慢走，认真看。<br />把微小的光，写成自己的故事。</blockquote>
    <p>
      这里写散步时的发现、阅读留下的念头，也记录构建网页时慢慢想通的问题。文章按分类、标签与时间整理，你可以从感兴趣的主题开始。
    </p>
    <h2 id="contact">找到我</h2>
    <p>这是博客前端模板的演示作者资料。用于真实站点时，请替换成自己的姓名、头像和联系方式。</p>
    <div class="about-links">
      <RouterLink to="/posts"
        ><BookOpen :size="24" aria-hidden="true" /><span
          ><strong>读一封来信</strong><small>从最近写下的文章开始</small></span
        ><ArrowUpRight :size="18" /></RouterLink
      ><a href="https://github.com/cosZone/astro-koharu" target="_blank" rel="noopener noreferrer"
        ><Github :size="24" aria-hidden="true" /><span
          ><strong>参考主题</strong><small>astro-koharu · cosZone</small></span
        ><ArrowUpRight :size="18"
      /></a>
    </div>
    <h2>关于这个小站</h2>
    <p>
      使用 Vue 3、Vite 与 TypeScript 重新实现 Koharu 的阅读体验。文章和友链是本地演示数据，追番展示 Bangumi
      的公开收藏。
    </p>
  </article>
</template>
