import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSettingsStore } from '../src/stores/settings'

function installBrowser(saved = '{}') {
  const localStorage = {
    getItem: vi.fn(() => saved),
    setItem: vi.fn(),
  }
  vi.stubGlobal('window', { localStorage })
  return { localStorage }
}

afterEach(() => vi.unstubAllGlobals())

describe('settings store', () => {
  it('drops removed display preferences and persists social links and account IDs', () => {
    const browser = installBrowser(
      JSON.stringify({
        font: 'serif',
        fontSize: 18,
        lineHeight: 2,
        lineWidth: 72,
        motionLevel: 'subtle',
        bilibiliUid: ' custom-bili ',
        bangumiUserId: ' custom-bgm ',
        socials: [
          { id: 'unsafe', label: 'Bad URL', icon: 'Link', href: 'javascript:alert(1)' },
          { id: 'site', label: 'Site', icon: 'Globe2', href: 'https://example.com/profile' },
        ],
      }),
    )
    setActivePinia(createPinia())
    const store = useSettingsStore()

    expect(store.bilibiliUid).toBe('custom-bili')
    expect(store.bangumiUserId).toBe('custom-bgm')
    expect(store.socials[0]?.href).toBe('')
    expect(store.socials[1]?.icon).toBe('Globe2')
    expect(store.socials[1]?.href).toBe('https://example.com/profile')

    const persisted = JSON.parse(browser.localStorage.setItem.mock.calls.at(-1)?.[1] || '{}')
    expect(persisted).toEqual({
      bilibiliUid: 'custom-bili',
      bangumiUserId: 'custom-bgm',
      socials: [
        { id: 'unsafe', label: 'Bad URL', icon: 'Link', href: '' },
        { id: 'site', label: 'Site', icon: 'Globe2', href: 'https://example.com/profile' },
      ],
    })
    expect(persisted).not.toHaveProperty('font')
    expect(persisted).not.toHaveProperty('motionLevel')
  })

  it('adds, removes, and persists profile social links', () => {
    const browser = installBrowser()
    setActivePinia(createPinia())
    const store = useSettingsStore()
    const startingCount = store.socials.length
    const id = store.addSocial()

    expect(store.socials).toHaveLength(startingCount + 1)
    const added = store.socials.find((item) => item.id === id)
    expect(added).toMatchObject({ label: '', icon: 'Link', href: '' })

    if (!added) throw new Error('Expected the new social link to exist')
    added.label = 'Portfolio'
    added.icon = 'Globe2'
    added.href = 'https://example.com'
    const saved = JSON.parse(browser.localStorage.setItem.mock.calls.at(-1)?.[1] || '{}')
    expect(saved.socials.find((item: { id: string }) => item.id === id)).toEqual({
      id,
      label: 'Portfolio',
      icon: 'Globe2',
      href: 'https://example.com',
    })
    store.removeSocial(id)

    expect(store.socials).toHaveLength(startingCount)
    const persisted = JSON.parse(browser.localStorage.setItem.mock.calls.at(-1)?.[1] || '{}')
    expect(persisted.socials).toHaveLength(startingCount)
    expect(persisted.socials.some((item: { id: string }) => item.id === id)).toBe(false)
  })

  it('resets account IDs and social links to the environment defaults', () => {
    const browser = installBrowser(
      JSON.stringify({
        bilibiliUid: 'custom-bili',
        bangumiUserId: 'custom-bgm',
        socials: [],
      }),
    )
    setActivePinia(createPinia())
    const store = useSettingsStore()

    store.reset()

    expect(store.bilibiliUid).toBe(String(import.meta.env.VITE_API_BILIBILI_UID || '').trim())
    expect(store.bangumiUserId).toBe(String(import.meta.env.VITE_BANGUMI_USER_ID || '').trim())
    expect(store.socials.map((item) => item.icon)).toEqual(['Github', 'Mail', 'Tv'])
    expect(browser.localStorage.setItem).toHaveBeenCalled()
  })

  it('keeps an intentionally empty social list and recovers malformed stored settings', () => {
    installBrowser(JSON.stringify({ socials: [] }))
    setActivePinia(createPinia())
    expect(useSettingsStore().socials).toEqual([])

    installBrowser('invalid-json')
    setActivePinia(createPinia())
    expect(useSettingsStore().socials.map((item) => item.id)).toEqual(['github', 'contact', 'bilibili'])
  })

  it('keeps settings usable when local storage is blocked', () => {
    const browser = installBrowser()
    browser.localStorage.setItem.mockImplementation(() => {
      throw new Error('Storage blocked')
    })
    setActivePinia(createPinia())
    const store = useSettingsStore()
    expect(() => (store.bangumiUserId = 'new-user')).not.toThrow()
    expect(store.bangumiUserId).toBe('new-user')
  })

  it('preserves Meteor and existing Lucide selections across reloads', () => {
    const browser = installBrowser(
      JSON.stringify({
        socials: [
          { id: 'old', label: 'GitHub', icon: 'Github', href: 'https://github.com' },
          { id: 'bili', label: '哔哩哔哩', icon: 'meteor:Bilibili', href: 'https://www.bilibili.com' },
          { id: 'meteor-mail', label: '邮件', icon: 'meteor:Envelope', href: 'mailto:hello@example.com' },
          { id: 'invalid', label: '无效图标库', icon: 'unknown:Mail', href: '/about' },
        ],
      }),
    )
    setActivePinia(createPinia())
    const store = useSettingsStore()
    expect(store.socials.map((item) => item.icon)).toEqual([
      'Github',
      'meteor:Bilibili',
      'meteor:Envelope',
      'Link',
    ])

    store.socials[0]!.icon = 'meteor:Github'
    const persisted = browser.localStorage.setItem.mock.calls.at(-1)?.[1] || '{}'
    installBrowser(persisted)
    setActivePinia(createPinia())
    expect(useSettingsStore().socials.map((item) => item.icon)).toEqual([
      'meteor:Github',
      'meteor:Bilibili',
      'meteor:Envelope',
      'Link',
    ])
  })

  it('persists Font Awesome families, hyphenated names and numeric brand names', () => {
    const icons = ['fa-solid:address-book', 'fa-regular:address-book', 'fa-brands:500px']
    const browser = installBrowser(
      JSON.stringify({
        socials: icons.map((icon, index) => ({
          id: `fa-${index}`,
          label: icon,
          icon,
          href: 'https://example.com',
        })),
      }),
    )
    setActivePinia(createPinia())
    const store = useSettingsStore()
    expect(store.socials.map((item) => item.icon)).toEqual(icons)

    store.socials[0]!.icon = 'fa-solid:heart'
    const persisted = browser.localStorage.setItem.mock.calls.at(-1)?.[1] || '{}'
    installBrowser(persisted)
    setActivePinia(createPinia())
    expect(useSettingsStore().socials.map((item) => item.icon)).toEqual(['fa-solid:heart', ...icons.slice(1)])
  })
})
