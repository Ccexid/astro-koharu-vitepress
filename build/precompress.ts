import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import { brotliCompress, constants, gzip } from 'node:zlib'
import type { Plugin } from 'vite'

const gzipAsync = promisify(gzip)
const brotliAsync = promisify(brotliCompress)

export function precompress(): Plugin {
  return {
    name: 'precompress-assets',
    apply: 'build',
    async writeBundle(options, bundle) {
      if (!options.dir) return
      const folder = options.dir
      await Promise.all(
        Object.values(bundle).map(async (file) => {
          if (!/\.(?:js|css|html|json|svg|ttf|otf|wasm)$/.test(file.fileName)) return
          const source = file.type === 'chunk' ? file.code : file.source
          const input = typeof source === 'string' ? Buffer.from(source, 'utf8') : Buffer.from(source)
          if (input.length < 1024) return
          const encoded = await Promise.all([
            gzipAsync(input, { level: 9 }),
            brotliAsync(input, { params: { [constants.BROTLI_PARAM_QUALITY]: 9 } }),
          ])
          await Promise.all(
            encoded.map(async (output, index) => {
              if (output.length >= input.length) return
              await writeFile(resolve(folder, `${file.fileName}.${index === 0 ? 'gz' : 'br'}`), output)
            }),
          )
        }),
      )
    },
  }
}
