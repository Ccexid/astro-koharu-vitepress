<script setup lang="ts">
import { computed, onScopeDispose, ref } from 'vue'
import { CalendarDays, Clock3, FileText, Link, Check } from 'lucide-vue-next'
import type { SiteCover } from '@/app/site-cover'
import { useHeroMotion } from '@/composables/useHeroMotion'
import { transitioningPost } from '@/composables/usePostTransition'
const props = defineProps<{ cover: SiteCover }>()
const hero = ref<HTMLElement | null>(null)
const image = ref<HTMLImageElement | null>(null)
const { paused, lowPower } = useHeroMotion(hero, image)
const copied = ref(false)
const copyMessage = ref('')
const compact = computed(() => props.cover.kind === 'page')
let copyTimer: ReturnType<typeof setTimeout> | undefined
onScopeDispose(() => clearTimeout(copyTimer))
async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copied.value = true
    copyMessage.value = '链接已复制'
  } catch {
    copyMessage.value = '复制失败，请从地址栏复制链接。'
  }
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => {
    copied.value = false
    copyMessage.value = ''
  }, 2200)
}
</script>
<template>
  <section
    ref="hero"
    class="site-hero"
    :class="{
      'is-home': cover.kind === 'home',
      'is-compact': compact,
      'is-paused': paused,
      'is-low-power': lowPower,
    }"
    aria-labelledby="site-title"
  >
    <div class="hero-background">
      <img
        :key="cover.image || 'default'"
        ref="image"
        class="hero-image"
        :src="
          cover.image ||
          'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=1920&q=85'
        "
        :alt="cover.imageAlt || ''"
        fetchpriority="high"
      />
    </div>
    <div class="hero-shade" aria-hidden="true"></div>
    <div class="hero-petals" aria-hidden="true">
      <i
        v-for="n in 8"
        :key="n"
        :style="{
          '--petal-index': n,
          '--petal-drift': `${n % 2 ? -75 - n * 13 : 55 + n * 11}px`,
          '--petal-turn': `${n % 2 ? 180 + n * 30 : -150 - n * 25}deg`,
        }"
      ></i>
    </div>
    <div class="hero-copy-motion">
      <div class="hero-copy">
        <p v-if="cover.kind === 'home'" class="hero-alternate">Koharu</p>
        <h1 id="site-title">
          <span
            :style="{
              viewTransitionName: cover.kind === 'article' && transitioningPost ? 'article-title' : undefined,
            }"
            >{{ cover.title }}</span
          ><button
            v-if="cover.kind === 'page'"
            class="cover-copy-link"
            type="button"
            aria-label="复制当前页面链接"
            @click="copyLink"
          >
            <Check v-if="copied" :size="24" aria-hidden="true" /><Link v-else :size="24" aria-hidden="true" />
          </button>
        </h1>
        <p v-if="cover.description" class="hero-subtitle">
          {{ cover.kind === 'home' ? '= ' + cover.description + ' =' : cover.description }}
        </p>
        <div v-if="cover.metadata?.length" class="hero-meta">
          <span v-for="(item, index) in cover.metadata" :key="item"
            ><CalendarDays v-if="index === 0" :size="14" aria-hidden="true" /><FileText
              v-else-if="index === 1"
              :size="14"
              aria-hidden="true"
            /><Clock3 v-else :size="14" aria-hidden="true" />{{ item }}</span
          >
        </div>
        <span class="sr-only" role="status">{{ copyMessage }}</span>
      </div>
    </div>
    <svg class="hero-waves" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true">
      <path class="wave-back" d="M-1440 45 q360 -40 720 0 t720 0 t720 0 t720 0 t720 0 t720 0 V100 H-1440Z" />
      <path class="wave-mid" d="M-1440 62 q360 35 720 0 t720 0 t720 0 t720 0 t720 0 t720 0 V100 H-1440Z" />
      <path class="wave-front" d="M-1440 80 q360 -25 720 0 t720 0 t720 0 t720 0 t720 0 t720 0 V100 H-1440Z" />
    </svg>
  </section>
</template>
<style scoped>
.site-hero {
  position: relative;
  display: grid;
  height: 60svh;
  min-height: 340px;
  max-height: 800px;
  place-items: center;
  overflow: hidden;
  isolation: isolate;
  background: #ba8495;
  color: #fff;
}
.site-hero.is-compact {
  height: 42svh;
  min-height: 288px;
  max-height: 480px;
}
.hero-background,
.hero-shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}
.hero-background {
  overflow: hidden;
}
.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 43%;
}
.hero-copy-motion {
  width: 100%;
  display: grid;
  place-items: center;
}
.hero-shade {
  background: linear-gradient(180deg, rgb(36 25 36 / 38%), rgb(36 25 36 / 20%));
}
:root[data-theme='dark'] .hero-shade {
  background: rgb(19 17 26 / 48%);
}
.hero-copy {
  max-width: 1100px;
  width: 100%;
  padding: 60px 24px 100px;
  text-align: center;
  text-shadow: 0 2px 6px rgb(20 12 20 / 65%);
}
.hero-copy h1 {
  margin: 0;
  font-size: 3rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0;
  text-wrap: balance;
  overflow-wrap: anywhere;
}
.hero-copy h1 > span {
  display: inline-block;
}
.is-home .hero-copy h1 {
  margin-top: 14px;
}
.is-compact .hero-copy h1 {
  font-size: 2.4rem;
}
.hero-alternate {
  margin: 0;
  font-size: 3rem;
  line-height: 1.2;
}
.hero-subtitle {
  margin: 22px 0 0;
  font-size: 0.9rem;
  letter-spacing: 0;
}
.hero-meta {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px 22px;
  margin-top: 20px;
  font-size: 0.85rem;
}
.hero-meta span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.cover-copy-link {
  display: inline-grid;
  width: 42px;
  height: 42px;
  margin-left: 8px;
  place-items: center;
  vertical-align: middle;
  border: 0;
  background: transparent;
  color: inherit;
}
.hero-waves {
  position: absolute;
  bottom: -1px;
  width: 100%;
  height: 90px;
  pointer-events: none;
}
.hero-waves path {
  fill: var(--page-bg);
}
.wave-back {
  opacity: 0.45;
}
.wave-mid {
  opacity: 0.65;
}
.hero-petals {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: -1;
}
.hero-petals i {
  position: absolute;
  top: -10%;
  left: calc(var(--petal-index) * 12%);
  width: 11px;
  height: 17px;
  border-radius: 80% 10% 80% 20%;
  background: rgb(255 210 224 / 65%);
  transform: rotate(35deg);
}
.hero-petals i:nth-child(3n) {
  width: 8px;
  height: 12px;
  opacity: 0.65;
}
.hero-petals i:nth-child(3n + 1) {
  width: 13px;
  height: 18px;
  opacity: 0.85;
}
.is-low-power .hero-petals i:nth-child(n + 4) {
  display: none;
}
.is-paused .hero-petals i,
.is-paused .hero-waves path {
  animation-play-state: paused;
}
.is-low-power .hero-waves path {
  animation: none;
}
@media (prefers-reduced-motion: no-preference) {
  .hero-petals i {
    animation: petal-fall calc(8s + var(--petal-index) * 1s) linear infinite;
    animation-delay: calc(var(--petal-index) * -2s);
  }
  .hero-waves path {
    animation: wave-drift 12s linear infinite;
    animation-delay: -2s;
  }
  .hero-waves .wave-mid {
    animation-duration: 7s;
    animation-delay: -3s;
  }
  .hero-waves .wave-front {
    animation-duration: 4s;
    animation-delay: -4s;
  }
}
@keyframes petal-fall {
  0% {
    transform: translate3d(0, 0, 0) rotate(35deg);
  }
  45% {
    transform: translate3d(calc(var(--petal-drift) * 0.35), 35svh, 0) rotate(calc(var(--petal-turn) * 0.4));
  }
  100% {
    transform: translate3d(var(--petal-drift), 80svh, 0) rotate(var(--petal-turn));
  }
}
@keyframes wave-drift {
  from {
    transform: translateX(-1440px);
  }
  to {
    transform: translateX(0);
  }
}
@media (max-width: 992px) {
  .site-hero.is-compact {
    height: 36svh;
    min-height: 256px;
  }
  .hero-copy {
    padding-bottom: 90px;
  }
  .hero-copy h1 {
    font-size: 2rem;
  }
  .hero-alternate {
    font-size: 2.7rem;
  }
  .hero-meta {
    font-size: 0.75rem;
  }
}
</style>
