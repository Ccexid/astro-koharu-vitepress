export function normalizeProfileSocialHref(value: unknown): string {
  if (typeof value !== 'string') return ''
  const href = value.trim().slice(0, 2048)
  if (!href) return ''
  if (/[\\\u0000-\u0020\u007f]/.test(href)) return ''
  if ((href.startsWith('/') && !href.startsWith('//')) || href.startsWith('#')) return href

  try {
    const protocol = new URL(href).protocol
    return ['http:', 'https:', 'mailto:', 'tel:', 'sms:'].includes(protocol) ? href : ''
  } catch {
    return ''
  }
}

export function isInternalProfileSocialHref(href: string): boolean {
  return (href.startsWith('/') && !href.startsWith('//')) || href.startsWith('#')
}
