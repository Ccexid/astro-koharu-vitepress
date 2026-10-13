<script setup lang="ts">
import PageHeading from '../components/PageHeading.vue'
</script>

<template>
  <PageHeading title="关于这片小花园" eyebrow="ABOUT" description="很高兴你来到这里。" />
  <div class="about-content">
    <p class="about-lead">Koharu 是一座放慢脚步的小小文字花园。</p>
    <p>这里收集日常、散步、阅读和创作时的片段。没有宏大的主题，只有想认真记住的几个瞬间。</p>
    <h2>写些什么</h2>
    <p>
      写一朵花的颜色，写回家时绕过的路，也写做网页时突然想通的问题。文章按分类、标签和时间整理，你可以从任意一处开始阅读。
    </p>
    <h2>关于这个模板</h2>
    <p>
      这个站点使用 Vue 3、Vite 和 TypeScript
      构建。当前展示的是结构化的本地示例内容，页面读取统一经过服务层；未来可以替换为独立后端提供的数据。
    </p>
    <p>
      视觉风格参考 astro-koharu 的公开博客，但页面布局和组件在这里重新实现。文章、作者与友链均为演示内容。
    </p>
  </div>
</template>
