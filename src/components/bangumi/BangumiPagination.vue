<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

defineProps<{ currentPage: number; totalPages: number; isLoading: boolean }>()
const emit = defineEmits<{ change: [page: number] }>()
</script>

<template>
  <nav class="bangumi-pagination" aria-label="追番列表分页">
    <button
      type="button"
      class="bangumi-page-button"
      :disabled="currentPage <= 1 || isLoading"
      aria-label="上一页"
      @click="emit('change', currentPage - 1)"
    >
      <ChevronLeft :size="17" aria-hidden="true" />
      <span>上一页</span>
    </button>
    <span class="bangumi-page-info">{{ currentPage }} / {{ totalPages }}</span>
    <button
      type="button"
      class="bangumi-page-button"
      :disabled="currentPage >= totalPages || isLoading"
      aria-label="下一页"
      @click="emit('change', currentPage + 1)"
    >
      <span>下一页</span>
      <ChevronRight :size="17" aria-hidden="true" />
    </button>
  </nav>
</template>
