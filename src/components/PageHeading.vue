<script setup lang="ts">
import { RouterLink } from 'vue-router'

withDefaults(defineProps<{ eyebrow?: string; title: string; description?: string }>(), {
  eyebrow: 'KOHARU / JOURNAL',
})
</script>

<template>
  <header class="page-heading">
    <p class="breadcrumbs"><RouterLink to="/">首页</RouterLink><span>/</span>{{ eyebrow }}</p>
    <h1>{{ title }}</h1>
    <p v-if="description" class="page-description">{{ description }}</p>
  </header>
</template>

<style scoped>
.page-heading {
  margin-bottom: 28px;
  padding-bottom: 25px;
  border-bottom: 1px solid var(--line);
}
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px;
  color: var(--muted);
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 0.7rem;
}
.breadcrumbs a {
  color: var(--muted);
  text-decoration: none;
}
@media (hover: hover) and (pointer: fine) {
  .breadcrumbs a:hover {
    color: var(--petal-deep);
  }
}
.page-heading h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 650;
  line-height: 1.35;
}
.page-description {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 0.88rem;
  line-height: 1.75;
}
@media (max-width: 820px) {
  .page-heading h1 {
    font-size: 2.15rem;
  }
}
@media (max-width: 420px) {
  .page-heading h1 {
    font-size: 1.9rem;
  }
}
</style>
