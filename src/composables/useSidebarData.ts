import { computed, onMounted, ref, watch } from 'vue'
import { ensureSocialIcon, resolveSocialIcon } from '@/app/social-icons'
import { isInternalProfileSocialHref, normalizeProfileSocialHref } from '@/utils/profile-social'
import { listCategories, listPosts, listTags } from '@/services/posts'
import { useSettingsStore } from '@/stores/settings'

export function useSidebarData() {
  const settings = useSettingsStore()
  const stats = ref({ posts: 0, categories: 0, tags: 0 })
  const error = ref(false)
  const profileSocials = computed(() =>
    settings.socials
      .filter((item) => item.href && normalizeProfileSocialHref(item.href) === item.href)
      .map((item) => ({
        ...item,
        component: resolveSocialIcon(item.icon),
        internal: isInternalProfileSocialHref(item.href),
      })),
  )

  async function reloadStats() {
    error.value = false
    try {
      const [posts, categories, tags] = await Promise.all([listPosts(), listCategories(), listTags()])
      stats.value = { posts: posts.length, categories: categories.length, tags: tags.length }
    } catch {
      error.value = true
    }
  }

  watch(
    () => settings.socials.map((item) => item.icon),
    async (icons) => {
      try {
        await Promise.all(icons.map(ensureSocialIcon))
      } catch {
        // Keep the fallback link icon when the optional icon chunk cannot be loaded.
      }
    },
    { immediate: true },
  )
  onMounted(() => void reloadStats())

  return { stats, error, profileSocials, reloadStats }
}
