import { expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { Link } from 'lucide-vue-next'
import { loadIconLibrary, resolveSocialIcon } from '../src/app/social-icons'

it('renders Font Awesome families independently with the existing pixel size contract', async () => {
  const [solid, regular, brands] = await Promise.all([
    loadIconLibrary('fa-solid'),
    loadIconLibrary('fa-regular'),
    loadIconLibrary('fa-brands'),
  ])
  expect(solid.heart).toBeDefined()
  expect(regular.heart).toBeDefined()
  expect(brands.github).toBeDefined()
  expect(solid.faHeart).toBeUndefined()
  expect(resolveSocialIcon('fa-solid:heart')).not.toBe(resolveSocialIcon('fa-regular:heart'))
  expect(resolveSocialIcon('fa-brands:nonexistent')).toBe(Link)

  for (const [value, prefix] of [
    ['fa-solid:heart', 'fas'],
    ['fa-regular:heart', 'far'],
    ['fa-brands:github', 'fab'],
  ]) {
    const html = await renderToString(
      createSSRApp({
        render: () => h(resolveSocialIcon(value!), { size: 19, 'aria-hidden': 'true' }),
      }),
    )
    expect(html).toContain(`data-prefix="${prefix}"`)
    expect(html).toContain('<path')
    expect(html).toContain('width:19px')
    expect(html).toContain('height:19px')
    expect(html).toContain('aria-hidden="true"')
  }
})
