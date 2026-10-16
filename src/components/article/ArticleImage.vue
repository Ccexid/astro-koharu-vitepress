<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'
const props = defineProps<{ src: string; alt: string; caption?: string }>()
const failed = ref(false)
const dialog = useTemplateRef('lightbox')
function imageError() {
  dialog.value?.close()
  failed.value = true
}
watch(
  () => props.src,
  () => {
    failed.value = false
  },
)
</script>
<template>
  <figure class="article-image">
    <div v-if="failed" class="image-fallback" role="status">
      图片加载失败：{{ alt || '未提供替代文本' }} <button type="button" @click="failed = false">重试</button>
    </div>
    <button
      v-else
      type="button"
      class="image-zoom"
      :aria-label="'查看大图：' + (alt || '正文图片')"
      @click="dialog?.showModal()"
    >
      <img :src="src" :alt="alt" loading="lazy" decoding="async" @error="failed = true" />
    </button>
    <figcaption v-if="caption">{{ caption }}</figcaption>
    <dialog
      ref="lightbox"
      class="article-lightbox"
      aria-label="图片大图"
      @click="$event.target === dialog && dialog?.close()"
    >
      <button type="button" autofocus @click="dialog?.close()">关闭大图</button>
      <img :src="src" :alt="alt" @error="imageError" />
      <p v-if="caption">{{ caption }}</p>
    </dialog>
  </figure>
</template>
