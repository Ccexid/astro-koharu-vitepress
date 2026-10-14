<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <section class="site-hero" :class="{ 'is-home': route.path === '/' }" aria-labelledby="site-title">
    <img
      class="hero-image"
      src="https://pbs.twimg.com/profile_banners/1480526297382408203/1643008263/1500x500"
      alt=""
      fetchpriority="high"
    />
    <div class="hero-shade" aria-hidden="true"></div>
    <div class="hero-copy">
      <p class="hero-kicker">A LITTLE JOURNAL OF EVERYDAY LIFE</p>
      <h1 v-if="route.path === '/'" id="site-title" class="hero-main-title">Koharu</h1>
      <p v-else id="site-title" class="hero-title hero-main-title">Koharu</p>
      <p class="hero-subtitle">把日常，寫成輕輕落下的花瓣</p>
    </div>
    <span class="hero-caption" aria-hidden="true">記錄微小，收藏日常</span>
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
  background: rgb(48 34 45 / 20%);
}

.hero-copy {
  max-width: 780px;
  padding: 84px 24px 50px;
  text-align: center;
  text-shadow: 0 2px 18px rgb(34 23 31 / 24%);
}

.hero-kicker {
  --hero-delay: 120ms;
  margin: 0 0 12px;
  font-size: 0.7rem;
  font-weight: 700;
}

.hero-copy h1,
.hero-title {
  --hero-delay: 230ms;
  margin: 0;
  font-family: 'Iowan Old Style', 'Noto Serif SC', 'Songti SC', Georgia, serif;
  font-size: 5rem;
  font-weight: 600;
  line-height: 1.08;
}

.hero-subtitle {
  --hero-delay: 340ms;
  margin: 17px 0 0;
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 1rem;
  font-weight: 600;
}

.hero-caption {
  position: absolute;
  right: max(28px, calc((100vw - 1280px) / 2));
  bottom: 51px;
  writing-mode: vertical-rl;
  font-size: 0.7rem;
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
}

@keyframes hero-rise {
  from {
    opacity: 0;
    translate: 0 1.5rem;
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
