<script setup lang="ts">
import { ArrowUpRight, Clock3 } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import type { Post } from '@/types/post'

defineProps<{ post: Post }>()
</script>

<template>
  <article class="post-card">
    <RouterLink class="post-cover-link" :to="`/posts/${post.slug}`" :aria-label="post.title">
      <img class="post-cover" :src="post.cover" :alt="post.coverAlt" loading="lazy" />
      <span v-if="post.pinned" class="cover-label">置顶文章</span>
    </RouterLink>
    <div class="post-card-body">
      <div class="post-meta-line">
        <RouterLink class="category-link" :to="`/categories/${post.category.slug}`">
          {{ post.category.name }}
        </RouterLink>
        <time :datetime="post.publishedAt">{{ post.publishedAt.replaceAll('-', '.') }}</time>
      </div>
      <h3>
        <RouterLink :to="`/posts/${post.slug}`">{{ post.title }}</RouterLink>
      </h3>
      <p class="post-excerpt">{{ post.excerpt }}</p>
      <div class="post-card-bottom">
        <div class="post-tags" aria-label="文章标签">
          <RouterLink v-for="tag in post.tags" :key="tag.slug" :to="`/tags/${tag.slug}`">
            #{{ tag.name }}
          </RouterLink>
        </div>
        <span class="read-time"><Clock3 :size="14" aria-hidden="true" />{{ post.readingMinutes }} 分钟</span>
      </div>
    </div>
    <RouterLink class="card-open" :to="`/posts/${post.slug}`" :aria-label="`阅读：${post.title}`">
      <ArrowUpRight :size="17" aria-hidden="true" />
    </RouterLink>
  </article>
</template>

<style scoped>
.post-card {
  position: relative;
  display: grid;
  grid-template-columns: minmax(190px, 0.78fr) minmax(0, 1.35fr);
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 5px;
  background: var(--surface);
}

.post-cover-link {
  position: relative;
  display: block;
  min-height: 202px;
  overflow: hidden;
  background: var(--petal-soft);
}

.post-cover {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 202px;
  object-fit: cover;
}

.cover-label {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 5px 9px;
  border-radius: 2px;
  background: var(--petal-deep);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 650;
}

.post-card-body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  padding: 24px 30px 22px;
}

.post-meta-line {
  display: flex;
  align-items: center;
  gap: 11px;
  color: var(--muted);
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 0.72rem;
}

.category-link {
  color: var(--leaf-deep);
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 700;
  text-decoration: none;
}

.post-card h3 {
  margin: 12px 30px 8px 0;
  font-family: var(--font-display);
  font-size: 1.32rem;
  font-weight: 650;
  line-height: 1.45;
}

.post-card h3 a {
  color: var(--ink);
  text-decoration: none;
}

.post-excerpt {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: var(--muted);
  font-size: 0.87rem;
  line-height: 1.75;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.post-card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 18px;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.post-tags a {
  color: var(--muted);
  font-size: 0.73rem;
  text-decoration: none;
}

.read-time {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 5px;
  color: var(--muted);
  font-size: 0.72rem;
}

.card-open {
  position: absolute;
  right: 14px;
  bottom: 14px;
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: var(--surface);
  color: var(--petal-deep);
  opacity: 0;
}

.post-card:focus-within .card-open {
  opacity: 1;
}

@media (hover: hover) and (pointer: fine) {
  .post-card {
    transition:
      border-color var(--motion-duration-hover) var(--motion-ease-hover),
      transform var(--motion-duration-hover) var(--motion-ease-hover),
      box-shadow var(--motion-duration-hover) var(--motion-ease-hover);
  }

  .card-open {
    transition: opacity var(--motion-duration-fast) ease;
  }

  .post-card:hover {
    border-color: color-mix(in srgb, var(--petal) 48%, var(--line));
    box-shadow: 0 14px 28px rgb(52 45 51 / 10%);
    transform: translateY(-2px);
  }

  .post-card h3 a:hover,
  .post-tags a:hover {
    color: var(--petal-deep);
  }

  .post-card:hover .card-open {
    opacity: 1;
  }
}

@media (max-width: 720px) {
  .post-card {
    grid-template-columns: minmax(0, 1fr);
  }

  .post-cover-link,
  .post-cover {
    min-height: 0;
    aspect-ratio: 16 / 8.5;
  }

  .post-card-body {
    padding: 20px 20px 22px;
  }

  .post-card h3 {
    font-size: 1.2rem;
  }

  .card-open {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
  }

  .post-card {
    translate: none !important;
    animation: none !important;
  }

  .post-card:hover {
    box-shadow: none;
    transform: none;
  }
}
</style>
