<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RefreshCw } from 'lucide-vue-next'

const props = defineProps<{
  hasMore: boolean
  isLoading: boolean
  errorMessage: string
}>()

const emit = defineEmits<{
  'load-more': []
  retry: []
}>()

const sentinel = ref<HTMLElement>()
const isIntersecting = ref(false)
let observer: IntersectionObserver | undefined

function requestLoadMore(): void {
  if (props.hasMore && !props.isLoading && !props.errorMessage) {
    emit('load-more')
  }
}

onMounted(() => {
  if (!sentinel.value || !('IntersectionObserver' in window)) return

  observer = new IntersectionObserver(
    ([entry]) => {
      isIntersecting.value = entry?.isIntersecting === true
      if (isIntersecting.value) requestLoadMore()
    },
    { rootMargin: '320px 0px' },
  )
  observer.observe(sentinel.value)
})

watch(
  () => [props.hasMore, props.isLoading, props.errorMessage],
  () => {
    if (isIntersecting.value) requestLoadMore()
  },
)

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div ref="sentinel" class="bangumi-load-more" aria-live="polite">
    <div v-if="isLoading" class="bangumi-load-more-state" role="status">
      <span class="bangumi-spinner" aria-hidden="true"></span>
      <span>正在加载更多…</span>
    </div>
    <div v-else-if="errorMessage" class="bangumi-load-more-error" role="alert">
      <span>{{ errorMessage }}</span>
      <button type="button" class="bangumi-retry" @click="emit('retry')">
        <RefreshCw :size="15" aria-hidden="true" />
        <span>重试</span>
      </button>
    </div>
    <div v-else-if="hasMore" class="bangumi-load-more-state">
      <span>下滑加载更多</span>
    </div>
    <div v-else class="bangumi-load-more-state">
      <span>已加载全部条目</span>
    </div>
  </div>
</template>
