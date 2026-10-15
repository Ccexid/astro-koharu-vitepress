<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Home, Archive } from 'lucide-vue-next'
</script>
<template>
  <div class="cat-not-found">
    <div class="cat-composition" aria-hidden="true">
      <span class="cat-digits">404</span
      ><svg class="cat-face" viewBox="0 0 300 200">
        <path
          d="M64 85 L52 24 L111 59 Q150 45 189 59 L248 24 L236 85 Q266 169 150 184 Q34 169 64 85Z"
          fill="none"
          stroke="currentColor"
          stroke-width="5"
          stroke-linejoin="round"
        />
        <path
          d="M108 108v9m84-9v9m-49 6 7 6 7-6m-7 6q-8 17-21 4m21-4q8 17 21 4M90 127l-43-9m43 22-43 5m163-18 43-9m-43 22 43 5"
          fill="none"
          stroke="currentColor"
          stroke-width="5"
          stroke-linecap="round"
        />
      </svg>
    </div>
    <p>喵？这条小路还没有被写下。</p>
    <div class="not-found-actions">
      <RouterLink to="/"><Home :size="16" aria-hidden="true" />返回首页</RouterLink
      ><RouterLink to="/archives"><Archive :size="16" aria-hidden="true" />浏览归档</RouterLink>
    </div>
  </div>
</template>
