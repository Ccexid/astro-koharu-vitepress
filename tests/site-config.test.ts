import { describe, expect, it } from 'vitest'
import { isNavigationActive, siteConfig } from '../src/config/site'

describe('site configuration', () => {
  it('defines page titles for every sidebar destination', () => {
    const destinations = siteConfig.navigation.sidebar.map((item) => item.to)

    expect(new Set(destinations).size).toBe(destinations.length)
    for (const path of destinations) {
      expect(siteConfig.pageTitles[path as keyof typeof siteConfig.pageTitles]).toBeDefined()
    }
  })

  it('marks nested routes active for their parent navigation item', () => {
    expect(isNavigationActive('/posts/a-note-for-spring', '/posts')).toBe(true)
    expect(isNavigationActive('/categories/life/reading', '/categories')).toBe(true)
    expect(isNavigationActive('/posts-old', '/posts')).toBe(false)
    expect(isNavigationActive('/about', '/')).toBe(false)
  })
})
