<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="site">
    <header class="site-header">
      <RouterLink class="brand" to="/">Koharu</RouterLink>
      <nav aria-label="主导航">
        <RouterLink to="/">首页</RouterLink>
      </nav>
    </header>
    <main class="site-main">
      <RouterView />
    </main>
    <footer class="site-footer">Koharu Vue Template</footer>
  </div>
</template>
