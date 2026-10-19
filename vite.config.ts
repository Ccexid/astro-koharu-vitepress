import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { loadEnv } from 'vite'
import { fontAwesomeCatalog } from './build/fontawesome-catalog.ts'
import { precompress } from './build/precompress.ts'
import { API_DEFAULTS } from './src/config/api-defaults.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [fontAwesomeCatalog(), vue(), precompress()],
    optimizeDeps: {
      entries: ['index.html'],
      include: ['@fortawesome/fontawesome-svg-core', '@fortawesome/vue-fontawesome'],
    },
    build: {
      manifest: true,
      license: { fileName: 'THIRD_PARTY_LICENSES.md' },
      reportCompressedSize: false,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'vue-vendor',
                test: /node_modules[\\/](?:@vue[\\/]|vue(?:-router)?[\\/]|pinia[\\/])/,
              },
            ],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      include: ['tests/**/*.test.ts'],
      // A JSON file can be added/removed without changing the glob module's source text.
      fsModuleCache: false,
    },
    server: {
      watch: {
        // Reference checkouts and browser profiles are not application inputs.
        ignored: ['**/.reference/**'],
      },
      proxy: {
        // Keep browser requests same-origin and avoid forwarding browser Origin to Bilibili.
        [API_DEFAULTS.paths.bilibiliPrefix]: {
          target: env.VITE_API_BILIBILI_URL || API_DEFAULTS.upstreams.bilibili,
          changeOrigin: true,
          rewrite: (path) => path.replace(API_DEFAULTS.paths.bilibiliPrefix, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyRequest) => {
              proxyRequest.removeHeader('origin')
              proxyRequest.setHeader('referer', API_DEFAULTS.referers.bilibili)
              proxyRequest.setHeader(
                'user-agent',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              )
            })
          },
        },
        [API_DEFAULTS.paths.uapiPrefix]: {
          target: env.VITE_API_UAPI_URL || API_DEFAULTS.upstreams.uapi,
          changeOrigin: true,
          rewrite: (path) => path.replace(API_DEFAULTS.paths.uapiPrefix, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyRequest) => {
              proxyRequest.removeHeader('origin')
              proxyRequest.setHeader('referer', API_DEFAULTS.referers.uapi)
              proxyRequest.setHeader(
                'user-agent',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              )
            })
          },
        },
      },
    },
  }
})
