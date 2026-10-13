import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import less from 'less'
import { describe, expect, it } from 'vitest'

describe('global Less styles', () => {
  it('preserves responsive container calculations during compilation', async () => {
    const mainStylesheet = resolve(process.cwd(), 'src/styles/main.less')
    const source = await readFile(mainStylesheet, 'utf8')
    const { css } = await less.render(source, { filename: mainStylesheet })

    expect(css).toContain('width: min(calc(100% - 48px), 1160px);')
    expect(css).toContain('width: min(calc(100% - 36px), 700px);')
  })
})
