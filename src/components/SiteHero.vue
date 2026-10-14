<script setup lang="ts">
import type { SiteCover } from '@/app/site-cover'

defineProps<{ cover: SiteCover }>()

const defaultCoverImage =
  'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=1920&q=85'
</script>

<template>
  <section class="site-hero" :class="{ 'is-home': cover.kind === 'home' }" aria-labelledby="site-title">
    <img
      class="hero-image"
      :src="cover.image || defaultCoverImage"
      :alt="cover.imageAlt || ''"
      fetchpriority="high"
    />
    <div class="hero-shade" aria-hidden="true"></div>
    <div class="hero-copy">
      <p v-if="cover.eyebrow" class="hero-kicker">{{ cover.eyebrow }}</p>
      <h1 v-if="cover.kind === 'home'" id="site-title" class="hero-main-title">
        {{ cover.title }}
      </h1>
      <p v-else id="site-title" class="hero-title hero-main-title">{{ cover.title }}</p>
      <p v-if="cover.description" class="hero-subtitle">{{ cover.description }}</p>
    </div>
    <span v-if="cover.kind === 'home'" class="hero-caption" aria-hidden="true"> 記錄微小，收藏日常 </span>
    <div class="hero-wave" aria-hidden="true"></div>
  </section>
</template>

<style scoped>
.site-hero {
  position: relative;
  display: grid;
  min-height: 378px;
  overflow: hidden;
  place-items: center;
  isolation: isolate;
  background: #ba8495;
  color: #fff;
}

.hero-image,
.hero-shade {
  position: absolute;
  z-index: -1;
  inset: 0;
  width: 100%;
  height: 100%;
}

.hero-image {
  object-fit: cover;
  object-position: center 43%;
}

.hero-shade {
  background: linear-gradient(180deg, rgb(48 34 45 / 34%), rgb(48 34 45 / 8%) 48%, rgb(48 34 45 / 18%));
}

:root[data-theme='dark'] .hero-shade {
  background: linear-gradient(180deg, rgb(23 19 30 / 52%), rgb(23 19 30 / 16%) 48%, rgb(23 19 30 / 36%));
}

.hero-copy {
  max-width: 780px;
  padding: 84px 24px 50px;
  text-align: center;
  text-shadow:
    0 2px 4px rgb(34 23 31 / 42%),
    0 8px 24px rgb(34 23 31 / 24%);
}

.hero-kicker {
  --hero-delay: 120ms;
  margin: 0 0 12px;
  font-size: var(--text-xs);
  font-weight: 700;
}

.hero-copy h1,
.hero-title {
  --hero-delay: 230ms;
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-display);
  font-weight: 600;
  line-height: 1.08;
  text-wrap: balance;
}

.hero-subtitle {
  --hero-delay: 340ms;
  margin: 17px 0 0;
  font-family: var(--font-display);
  font-size: var(--text-base);
  font-weight: 600;
}

.hero-caption {
  position: absolute;
  right: max(28px, calc((100vw - var(--header-max-width)) / 2));
  bottom: 51px;
  writing-mode: vertical-rl;
  font-size: var(--text-xs);
  font-weight: 600;
}

.hero-wave {
  position: absolute;
  right: -6%;
  bottom: -29px;
  left: -6%;
  height: 54px;
  border-radius: 50% 50% 0 0 / 75% 75% 0 0;
  background: var(--page-bg);
}

@media (prefers-reduced-motion: no-preference) {
  .site-hero.is-home .hero-kicker,
  .site-hero.is-home .hero-main-title,
  .site-hero.is-home .hero-subtitle {
    animation: hero-rise var(--motion-duration-enter) var(--motion-ease-enter) both;
    animation-delay: var(--hero-delay);
  }

  .site-hero.is-home .hero-wave {
    animation: hero-wave-enter 760ms var(--motion-ease-enter) both;
  }
}

@keyframes hero-rise {
  from {
    opacity: 0;
    translate: 0 1.5rem;
  }
}

@keyframes hero-wave-enter {
  from {
    translate: 0 70%;
  }
}

@media (max-width: 820px) {
  .site-hero {
    min-height: 340px;
  }

  .hero-copy {
    padding-top: 83px;
  }

  .hero-copy h1,
  .hero-title {
    font-size: 3.5rem;
  }

  .hero-subtitle {
    font-size: 0.9rem;
  }

  .hero-caption {
    right: 20px;
    bottom: 45px;
  }
}

@media (max-width: 420px) {
  .site-hero {
    min-height: 315px;
  }

  .hero-copy h1,
  .hero-title {
    font-size: 3rem;
  }

  .hero-kicker {
    font-size: 0.62rem;
  }
}
</style>
