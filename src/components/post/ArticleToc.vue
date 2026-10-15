<script setup lang="ts">
defineProps<{ sections: Array<{ id: string; title: string }>; activeId: string }>()
defineEmits<{ navigate: [] }>()
</script>
<template>
  <nav class="reading-toc" aria-label="文章目录">
    <a
      v-for="(section, index) in sections"
      :key="section.id"
      :href="'#' + section.id"
      :class="{ 'is-current': activeId === section.id }"
      :aria-current="activeId === section.id ? 'location' : undefined"
      @click="$emit('navigate')"
    >
      <span class="toc-number">{{ String(index + 1).padStart(2, '0') }}</span
      >{{ section.title }}
    </a>
    <p v-if="!sections.length" class="toc-empty">这篇文章暂无目录。</p>
  </nav>
</template>
