import { describe, expect, it } from 'vitest'
import { isInternalProfileSocialHref, normalizeProfileSocialHref } from '../src/app/profile-social'

describe('profile social links', () => {
  it('accepts supported web, contact and internal links', () => {
    for (const href of [
      'https://example.com',
      'http://example.com',
      'mailto:hi@example.com',
      'tel:+12345',
      '/about#contact',
      '#contact',
    ]) {
      expect(normalizeProfileSocialHref(` ${href} `)).toBe(href)
    }
    expect(isInternalProfileSocialHref('/about#contact')).toBe(true)
    expect(isInternalProfileSocialHref('#contact')).toBe(true)
    expect(isInternalProfileSocialHref('https://example.com')).toBe(false)
  })

  it('rejects invalid URLs, unsafe protocols and disguised external paths', () => {
    for (const href of [
      '',
      'example.com',
      'javascript:alert(1)',
      'data:text/html,hello',
      '//example.com',
      '/\\example.com',
      '/\n/example.com',
      'https://',
    ]) {
      expect(normalizeProfileSocialHref(href)).toBe('')
    }
  })
})
