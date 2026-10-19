import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { normalizeProfileSocialHref } from '@/utils/profile-social'

export interface ProfileSocialLink {
  id: string
  label: string
  icon: string
  href: string
}

export interface SettingsSnapshot {
  bilibiliUid: string
  bangumiUserId: string
  socials: ProfileSocialLink[]
}

const storageKey = 'koharu-settings'
let socialIdSequence = 0

const defaultSocials: ProfileSocialLink[] = [
  {
    id: 'github',
    label: 'GitHub',
    icon: 'Github',
    href: 'https://github.com/Ccexid/astro-koharu-vitepress',
  },
  { id: 'contact', label: '联系方式', icon: 'Mail', href: '/about#contact' },
  { id: 'bilibili', label: '哔哩哔哩', icon: 'Tv', href: 'https://space.bilibili.com/19580033' },
]

const defaults: SettingsSnapshot = {
  bilibiliUid: String(import.meta.env.VITE_API_BILIBILI_UID || '').trim(),
  bangumiUserId: String(import.meta.env.VITE_BANGUMI_USER_ID || '').trim(),
  socials: defaultSocials,
}

function readStored(): Partial<SettingsSnapshot> {
  if (typeof window === 'undefined') return {}
  try {
    const value = JSON.parse(window.localStorage.getItem(storageKey) || '{}') as Partial<SettingsSnapshot>
    return value && typeof value === 'object' ? value : {}
  } catch {
    return {}
  }
}

function normalizeSocials(value: unknown): ProfileSocialLink[] {
  if (!Array.isArray(value)) return defaultSocials.map((item) => ({ ...item }))
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item, index) => ({
      id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `social-${index + 1}`,
      label: typeof item.label === 'string' ? item.label.trim().slice(0, 48) : '',
      icon:
        typeof item.icon === 'string' &&
        /^(?:(?:meteor:)?[A-Z][A-Za-z0-9]*|fa-(?:solid|regular|brands):[a-z0-9]+(?:-[a-z0-9]+)*)$/.test(
          item.icon,
        )
          ? item.icon
          : 'Link',
      href: normalizeProfileSocialHref(item.href),
    }))
}

function normalizeSettings(value: Partial<SettingsSnapshot>): SettingsSnapshot {
  return {
    bilibiliUid: typeof value.bilibiliUid === 'string' ? value.bilibiliUid.trim() : defaults.bilibiliUid,
    bangumiUserId:
      typeof value.bangumiUserId === 'string' ? value.bangumiUserId.trim() : defaults.bangumiUserId,
    socials: normalizeSocials(value.socials),
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const stored = normalizeSettings({ ...defaults, ...readStored() })
  const bilibiliUid = ref(stored.bilibiliUid)
  const bangumiUserId = ref(stored.bangumiUserId)
  const socials = ref(stored.socials)

  function snapshot(): SettingsSnapshot {
    return normalizeSettings({
      bilibiliUid: bilibiliUid.value,
      bangumiUserId: bangumiUserId.value,
      socials: socials.value,
    })
  }

  function addSocial(): string {
    const id = `social-${Date.now()}-${++socialIdSequence}`
    socials.value.push({ id, label: '', icon: 'Link', href: '' })
    return id
  }

  function removeSocial(id: string): void {
    socials.value = socials.value.filter((item) => item.id !== id)
  }

  function reset(): void {
    bilibiliUid.value = defaults.bilibiliUid
    bangumiUserId.value = defaults.bangumiUserId
    socials.value = defaultSocials.map((item) => ({ ...item }))
  }

  watch(
    [bilibiliUid, bangumiUserId, socials],
    () => {
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(snapshot()))
        } catch {
          // Settings still work for this visit when browser storage is unavailable.
        }
      }
    },
    { deep: true, immediate: true, flush: 'sync' },
  )

  return { bilibiliUid, bangumiUserId, socials, addSocial, removeSocial, reset, snapshot }
})
