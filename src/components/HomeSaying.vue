<script setup lang="ts">
import { useSayingTypewriter } from '@/composables/useSayingTypewriter'

const props = defineProps<{ fallback: string }>()
const { text, characters, visibleCount, typing } = useSayingTypewriter(props.fallback)
</script>

<template>
  <span class="home-saying" :class="{ 'is-typing': typing }">
    <span class="sr-only">{{ text }}</span>
    <span class="saying-characters" aria-hidden="true"
      ><span
        v-for="(character, index) in characters"
        :key="index"
        class="saying-character"
        :class="{
          'is-visible': index < visibleCount,
          'has-caret': typing && index === Math.max(0, visibleCount - 1),
        }"
        >{{ character }}</span
      ></span
    >
  </span>
</template>

<style scoped>
.home-saying {
  max-width: 100%;
}
.saying-characters {
  white-space: pre-wrap;
}
.saying-character {
  position: relative;
  opacity: 0;
}
.saying-character.is-visible {
  opacity: 1;
}
.saying-character.has-caret::after {
  position: absolute;
  inset-inline-end: -0.08em;
  top: 0.08em;
  width: 2px;
  height: 0.95em;
  background: currentColor;
  content: '';
}
/* Keep the initial cursor visible while the first character is still hidden. */
.is-typing .saying-character:first-child:not(.is-visible) {
  opacity: 1;
  color: transparent;
}
.is-typing .saying-character:first-child:not(.is-visible)::after {
  inset-inline: 0 auto;
  background: #fff;
}
@media (prefers-reduced-motion: reduce) {
  .saying-character.has-caret::after {
    display: none;
  }
}
</style>
