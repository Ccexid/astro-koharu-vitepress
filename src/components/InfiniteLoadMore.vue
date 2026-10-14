<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RefreshCw } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    hasMore: boolean
    isLoading: boolean
    errorMessage?: string
    loadingText?: string
    loadMoreText?: string
    completeText?: string
  }>(),
  {
    errorMessage: '',
    loadingText: '正在加载更多…',
    loadMoreText: '下滑加载更多',
    completeText: '已加载全部内容',
  },
)

const emit = defineEmits<{
  'load-more': []
  retry: []
}>()

const sentinel = ref<HTMLElement | null>(null)
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
  <div ref="sentinel" class="infinite-load-more" aria-live="polite">
    <div v-if="isLoading" class="infinite-load-more-state" role="status">
      <span class="infinite-spinner" aria-hidden="true"></span>
      <span>{{ loadingText }}</span>
    </div>
    <div v-else-if="errorMessage" class="infinite-load-more-error" role="alert">
      <span>{{ errorMessage }}</span>
      <button type="button" class="infinite-retry" @click="emit('retry')">
        <RefreshCw :size="15" aria-hidden="true" />
        <span>重试</span>
      </button>
    </div>
    <div v-else-if="hasMore" class="infinite-load-more-state">
      <span>{{ loadMoreText }}</span>
    </div>
    <div v-else class="infinite-load-more-state">
      <span>{{ completeText }}</span>
    </div>
  </div>
</template>

<style scoped>
.infinite-load-more {
  display: flex;
  justify-content: center;
  min-height: 64px;
  padding-top: 10px;
}

.infinite-load-more-state,
.infinite-load-more-error {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--muted);
  font-size: 0.74rem;
  text-align: center;
}

.infinite-load-more-error {
  flex-wrap: wrap;
}

.infinite-spinner {
  width: 23px;
  aspect-ratio: 1;
  border: 2px solid var(--line);
  border-top-color: var(--infinite-accent, var(--petal-deep));
  border-radius: 50%;
  animation: infinite-load-more-spin 800ms linear infinite;
}

.infinite-retry {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 7px 11px;
  border: 1px solid var(--line);
  border-radius: 3px;
  background: var(--surface);
  color: var(--ink);
  font-size: 0.76rem;
}

.infinite-retry:hover,
.infinite-retry:focus-visible {
  border-color: var(--infinite-accent, var(--petal-deep));
  color: var(--infinite-accent, var(--petal-deep));
}

@keyframes infinite-load-more-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
