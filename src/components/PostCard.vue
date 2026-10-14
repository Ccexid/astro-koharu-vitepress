<script setup lang="ts">
import { CalendarDays, Clock3, Flag, Tag } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import type { Post } from '@/types/post'

withDefaults(defineProps<{ post: Post; leftClip?: boolean }>(), {
  leftClip: true,
})
</script>

<template>
  <article class="post-card" :data-cover-side="leftClip ? 'left' : 'right'">
    <RouterLink class="post-cover-link" :to="`/posts/${post.slug}`" tabindex="-1" aria-hidden="true">
      <img class="post-cover" :src="post.cover" alt="" loading="lazy" decoding="async" />
      <span v-if="post.pinned" class="cover-label">置顶文章</span>
    </RouterLink>

    <div class="post-card-body">
      <div class="post-meta-line">
        <RouterLink class="category-link" :to="`/categories/${post.category.slug}`">
          <Flag :size="13" aria-hidden="true" />
          <span>{{ post.category.name }}</span>
        </RouterLink>
        <div class="post-meta-details">
          <time :datetime="post.publishedAt">
            <CalendarDays :size="13" aria-hidden="true" />
            {{ post.publishedAt.replaceAll('-', '.') }}
          </time>
          <span class="read-time">
            <Clock3 :size="13" aria-hidden="true" />{{ post.readingMinutes }} 分钟
          </span>
        </div>
      </div>

      <h3 class="post-title">
        <RouterLink :to="`/posts/${post.slug}`">{{ post.title }}</RouterLink>
      </h3>
      <p class="post-excerpt">{{ post.excerpt }}</p>

      <div v-if="post.tags.length" class="post-card-footer">
        <div class="post-tags" aria-label="文章标签">
          <RouterLink v-for="tag in post.tags" :key="tag.slug" :to="`/tags/${tag.slug}`">
            <Tag :size="12" aria-hidden="true" />{{ tag.name }}
          </RouterLink>
        </div>
      </div>
    </div>

    <RouterLink class="post-item-more" :to="`/posts/${post.slug}`" tabindex="-1" aria-hidden="true">
      more...
    </RouterLink>
  </article>
</template>

<style scoped>
.post-card {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 186px;
  overflow: hidden;
  border-radius: 8px;
  background: var(--surface);
  box-shadow: 0 5px 15px rgb(52 45 51 / 10%);
  transition:
    translate var(--motion-duration-hover) var(--motion-ease-hover),
    box-shadow var(--motion-duration-hover) var(--motion-ease-hover);
}

.post-cover-link {
  position: relative;
  display: block;
  width: calc(50% - 2rem);
  min-width: 0;
  max-height: 186px;
  flex: 0 0 calc(50% - 2rem);
  overflow: hidden;
  background: var(--petal-soft);
  transition: clip-path 900ms var(--motion-ease-enter);
}

.post-card[data-cover-side='left'] .post-cover-link {
  order: 1;
  border-radius: 8px 0 0 8px;
  clip-path: polygon(0 0, 92% 0, 100% 100%, 0 100%);
}

.post-card[data-cover-side='right'] .post-cover-link {
  order: 2;
  border-radius: 0 8px 8px 0;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 8% 100%);
}

.post-cover {
  display: block;
  width: 100%;
  height: 186px;
  object-fit: cover;
  transition:
    scale 900ms var(--motion-ease-enter),
    filter 900ms var(--motion-ease-enter);
}

.cover-label {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 4px 8px;
  border-radius: 3px;
  background: var(--petal-deep);
  color: #fff;
  font-size: 0.69rem;
  font-weight: 650;
}

.post-card-body {
  position: relative;
  z-index: 1;
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  padding: 15px 16px 36px;
}

.post-card[data-cover-side='left'] .post-card-body {
  order: 2;
  margin-left: -12px;
}

.post-card[data-cover-side='right'] .post-card-body {
  order: 1;
  margin-right: -12px;
}

.post-meta-line,
.post-meta-details,
.category-link,
.post-meta-line time,
.read-time {
  display: inline-flex;
  min-width: 0;
  align-items: center;
}

.post-meta-line {
  justify-content: space-between;
  gap: 8px;
  color: var(--muted);
  font-size: 0.7rem;
}

.category-link {
  gap: 5px;
  overflow: hidden;
  color: var(--leaf-deep);
  font-size: 0.73rem;
  font-weight: 650;
  text-decoration: none;
  white-space: nowrap;
}

.category-link span {
  overflow: hidden;
  text-overflow: ellipsis;
}

.post-meta-details {
  flex: 0 0 auto;
  gap: 9px;
  white-space: nowrap;
}

.post-meta-line time,
.read-time {
  gap: 4px;
  color: var(--muted);
}

.post-title {
  min-width: 0;
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.16rem;
  font-weight: 700;
  line-height: 1.45;
}

.post-title a {
  display: block;
  overflow: hidden;
  color: var(--petal-deep);
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-excerpt {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: var(--muted);
  font-size: 0.82rem;
  line-height: 1.65;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.post-card-footer {
  min-width: 0;
  margin-top: auto;
}

.post-tags {
  display: flex;
  overflow-x: auto;
  gap: 7px;
  scrollbar-width: none;
}

.post-tags::-webkit-scrollbar {
  display: none;
}

.post-tags a {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 3px;
  padding: 3px 6px;
  border-radius: 3px;
  background: var(--petal-soft);
  color: var(--muted);
  font-size: 0.68rem;
  font-weight: 650;
  text-decoration: none;
  white-space: nowrap;
}

.post-item-more {
  position: absolute;
  z-index: 2;
  bottom: 0;
  padding: 6px 12px;
  background: linear-gradient(110deg, var(--petal), var(--petal-deep));
  color: #fff;
  font-size: 0.75rem;
  text-decoration: none;
  transition:
    translate 500ms var(--motion-ease-enter),
    box-shadow 500ms var(--motion-ease-enter);
}

.post-card[data-cover-side='left'] .post-item-more {
  right: 0;
  border-radius: 6px 0 0;
}

.post-card[data-cover-side='right'] .post-item-more {
  left: 0;
  border-radius: 0 6px 0 0;
}

.post-card:focus-within {
  outline: 2px solid var(--petal);
  outline-offset: 3px;
}

@media (max-width: 768px) {
  .post-card {
    flex-direction: column;
  }

  .post-cover-link {
    width: 100%;
    max-height: 186px;
    flex: 0 0 186px;
    order: 0 !important;
    border-radius: 8px 8px 0 0 !important;
    clip-path: none !important;
  }

  .post-card-body,
  .post-card[data-cover-side='left'] .post-card-body,
  .post-card[data-cover-side='right'] .post-card-body {
    width: 100%;
    min-height: 176px;
    margin: 0;
    padding: 14px 16px 38px;
    order: 1;
  }

  .post-tags,
  .post-card[data-cover-side='left'] .post-tags,
  .post-card[data-cover-side='right'] .post-tags {
    padding-right: 60px;
    padding-left: 0;
  }

  .post-item-more,
  .post-card[data-cover-side='right'] .post-item-more {
    right: 0;
    left: auto;
    border-radius: 6px 0 0;
  }
}

@media (hover: hover) and (pointer: fine) {
  .post-card:hover {
    translate: 0 -4px;
    box-shadow:
      0 20px 40px -20px rgb(217 79 115 / 40%),
      0 8px 20px -12px rgb(52 45 51 / 22%);
  }

  .post-card:hover .post-cover {
    scale: 1.06;
    filter: saturate(1.08);
  }

  .post-card:hover .post-item-more {
    translate: 4px 0;
    box-shadow: 0 6px 18px -5px rgb(217 79 115 / 60%);
  }

  .post-card[data-cover-side='right']:hover .post-item-more {
    translate: -4px 0;
  }

  .category-link:hover,
  .post-title a:hover,
  .post-tags a:hover {
    color: var(--petal-deep);
  }
}

@media (hover: hover) and (min-width: 769px) {
  .post-card[data-cover-side='left']:hover .post-cover-link {
    clip-path: polygon(0 0, 95% 0, 100% 100%, 0 100%);
  }

  .post-card[data-cover-side='right']:hover .post-cover-link {
    clip-path: polygon(0 0, 100% 0, 100% 100%, 5% 100%);
  }
}

@media (max-width: 380px) {
  .post-card-body {
    gap: 6px;
    padding-right: 11px;
    padding-left: 11px;
  }

  .post-meta-details {
    gap: 5px;
  }

  .read-time {
    display: none;
  }

  .post-title {
    font-size: 1.03rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .post-card,
  .post-cover-link,
  .post-cover,
  .post-item-more {
    transition: none !important;
  }

  .post-card:hover {
    translate: none;
    box-shadow: 0 5px 15px rgb(52 45 51 / 10%);
  }

  .post-card:hover .post-cover {
    scale: 1;
    filter: none;
  }
}
</style>
