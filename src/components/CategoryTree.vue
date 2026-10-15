<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Flower2 } from 'lucide-vue-next'
import type { TaxonomyItem } from '@/types/post'
withDefaults(defineProps<{ items: TaxonomyItem[]; nested?: boolean }>(), { nested: false })
</script>
<template>
  <ol class="category-tree" :class="{ 'is-nested': nested }">
    <li v-for="item in items" :key="item.slug">
      <RouterLink class="category-branch" :to="'/categories/' + item.slug"
        ><Flower2 v-if="!nested" :size="16" aria-hidden="true" /><span>{{ item.name }}</span
        ><span class="category-leader" aria-hidden="true"></span><small>{{ item.count }}</small></RouterLink
      >
      <CategoryTree v-if="item.children?.length" :items="item.children" nested />
    </li>
  </ol>
</template>
