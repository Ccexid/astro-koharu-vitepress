<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ImageOff, Star } from 'lucide-vue-next'
import { collectionStatuses, type CollectionItem } from '@/types/bangumi'
const props = defineProps<{ item: CollectionItem; showStatus: boolean }>()
const imageFailed = ref(false)
watch(
  () => props.item.image,
  () => (imageFailed.value = false),
)
const statusLabel = computed(
  () => collectionStatuses.find((state) => state.value === props.item.status)?.label,
)
</script>
<template>
  <div class="masonry-item">
    <a
      class="bangumi-card masonry-content"
      :href="'https://bgm.tv/subject/' + item.id"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="item.title + '，在 Bangumi 打开'"
    >
      <div class="bangumi-poster">
        <img
          v-if="item.image && !imageFailed"
          :src="item.image"
          alt=""
          loading="lazy"
          decoding="async"
          referrerpolicy="no-referrer"
          @error="imageFailed = true"
        />
        <span v-else class="poster-placeholder"><ImageOff :size="26" aria-hidden="true" />暂无封面</span>
        <span v-if="showStatus && item.status === 3" class="bangumi-ribbon">在看</span>
      </div>
      <h2 class="bangumi-title">{{ item.title }}</h2>
      <p v-if="item.originalTitle !== item.title" class="bangumi-original">{{ item.originalTitle }}</p>
      <p class="bangumi-meta">
        <span v-if="showStatus && item.status !== 3">{{ statusLabel }}</span>
        <span v-if="item.date">{{ item.date.slice(0, 4) }}</span>
        <span v-if="item.score !== null" :class="{ 'own-score': item.ownScore }"
          ><Star :size="12" aria-hidden="true" />{{ item.score
          }}<span class="sr-only">{{ item.ownScore ? '个人评分' : '社区评分' }}</span></span
        >
      </p>
    </a>
  </div>
</template>
