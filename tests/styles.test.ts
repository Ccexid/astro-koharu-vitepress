import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import less from 'less'
import { describe, expect, it } from 'vitest'

describe('global Less styles', () => {
  it('preserves responsive container calculations during compilation', async () => {
    const mainStylesheet = resolve(process.cwd(), 'src/styles/main.less')
    const source = await readFile(mainStylesheet, 'utf8')
    const { css } = await less.render(source, { filename: mainStylesheet })

    expect(css).toContain('width: min(100%, var(--content-max-width));')
    expect(css).toContain('grid-template-columns: 256px minmax(0, 1fr);')
    expect(css).toContain('--page-gutter: 18px;')
  })
})
