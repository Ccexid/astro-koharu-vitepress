<script setup lang="ts">
import { computed, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import { Search } from 'lucide-vue-next'
import {
  iconLibraryOf,
  iconLibraryLabels,
  iconLibraryOptions,
  loadIconLibrary,
  socialIcons,
  socialIconValue,
  resolveSocialIcon,
  type IconLibrary,
} from '@/app/social-icons'

const props = defineProps<{ selected: string }>()
defineEmits<{ select: [name: string] }>()
const library = shallowRef<IconLibrary>(iconLibraryOf(props.selected))
const libraryLabel = computed(() => iconLibraryLabels[library.value])
const query = shallowRef('')
const limit = shallowRef(72)
const loading = shallowRef(true)
const error = shallowRef(false)
const search = useTemplateRef<HTMLInputElement>('search')
const names = computed(() => {
  const term = query.value
    .trim()
    .replace(/[-\s_]/g, '')
    .toLowerCase()
  return Object.keys(socialIcons.value[library.value]).filter((name) =>
    name
      .replace(/[-\s_]/g, '')
      .toLowerCase()
      .includes(term),
  )
})
const visibleNames = computed(() => names.value.slice(0, limit.value))
let loadVersion = 0

async function loadIcons() {
  const version = ++loadVersion
  loading.value = true
  error.value = false
  try {
    await loadIconLibrary(library.value)
  } catch {
    if (version === loadVersion) error.value = true
  } finally {
    if (version === loadVersion) loading.value = false
  }
}

watch(query, () => (limit.value = 72))
watch(
  library,
  (_library, _previous, onCleanup) => {
    query.value = ''
    limit.value = 72
    void loadIcons()
    onCleanup(() => {
      loadVersion++
    })
  },
  { immediate: true },
)
onMounted(() => {
  search.value?.focus()
})
</script>

<template>
  <div class="icon-picker" role="group" aria-label="社交图标选择器">
    <div class="icon-libraries" role="group" aria-label="图标库">
      <button
        v-for="item in iconLibraryOptions"
        :key="item"
        type="button"
        :aria-pressed="library === item"
        @click="library = item"
      >
        {{ iconLibraryLabels[item] }}
      </button>
    </div>
    <label class="icon-search">
      <Search :size="15" aria-hidden="true" />
      <input
        ref="search"
        v-model="query"
        aria-label="搜索图标"
        :placeholder="`搜索全部 ${libraryLabel} 图标`"
      />
    </label>
    <p v-if="loading" role="status">正在载入图标…</p>
    <div v-else-if="error" class="icon-load-error" role="alert">
      <p>图标载入失败</p>
      <button type="button" class="icon-more" @click="loadIcons">重试</button>
    </div>
    <p v-else-if="!names.length" role="status">没有匹配的图标</p>
    <template v-else>
      <div class="icon-picker-grid">
        <button
          v-for="name in visibleNames"
          :key="name"
          type="button"
          :aria-pressed="socialIconValue(library, name) === selected"
          :title="`${libraryLabel} / ${name}`"
          @click="$emit('select', socialIconValue(library, name))"
        >
          <component :is="resolveSocialIcon(socialIconValue(library, name))" :size="18" aria-hidden="true" />
          <span>{{ name }}</span>
        </button>
      </div>
      <button v-if="names.length > visibleNames.length" class="icon-more" type="button" @click="limit += 72">
        加载更多（{{ visibleNames.length }}/{{ names.length }}）
      </button>
      <p v-else role="status">{{ names.length }} 个图标</p>
    </template>
  </div>
</template>

<style scoped>
.icon-picker {
  display: grid;
  gap: 10px;
  padding-top: 2px;
}
.icon-search {
  position: relative;
  display: flex;
  align-items: center;
}
.icon-libraries {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.icon-libraries button {
  min-height: 36px;
  padding: 6px 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--page-bg);
  color: var(--muted);
  font: inherit;
  font-size: 0.8rem;
}
.icon-libraries button[aria-pressed='true'] {
  border-color: var(--petal);
  background: var(--petal-soft);
  color: var(--petal-deep);
}
.icon-search svg {
  position: absolute;
  left: 11px;
  color: var(--muted);
}
.icon-search input {
  width: 100%;
  min-height: 40px;
  padding: 8px 10px 8px 34px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--page-bg);
  color: var(--ink);
  font: inherit;
  font-size: 0.82rem;
}
.icon-picker p {
  margin: 0;
  color: var(--muted);
  font-size: 0.75rem;
}
.icon-load-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.icon-picker-grid {
  display: grid;
  max-height: 220px;
  grid-template-columns: repeat(auto-fill, minmax(82px, 1fr));
  gap: 6px;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 3px;
}
.icon-picker-grid button {
  display: grid;
  min-width: 0;
  min-height: 58px;
  gap: 4px;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 7px 4px;
  background: var(--page-bg);
  color: var(--muted);
  font: inherit;
  font-size: 0.62rem;
}
.icon-picker-grid button:hover,
.icon-picker-grid button[aria-pressed='true'] {
  border-color: var(--petal);
  background: var(--petal-soft);
  color: var(--petal-deep);
}
.icon-picker-grid span {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}
.icon-more {
  min-height: 36px;
  justify-self: center;
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 5px 9px;
  background: transparent;
  color: var(--petal-deep);
  font: inherit;
  font-size: 0.78rem;
}
@media (max-width: 600px) {
  .icon-search input {
    font-size: 1rem;
  }
}
</style>
