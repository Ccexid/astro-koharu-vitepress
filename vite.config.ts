import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { loadEnv } from 'vite'
import { fontAwesomeCatalog } from './build/fontawesome-catalog.ts'
import { precompress } from './build/precompress.ts'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      fontAwesomeCatalog(),
      vue(),
      precompress(),
      viteStaticCopy({
        targets: [
          {
            src: 'public/_worker.js',
            dest: '.', // 复制到 dist 根目录
          },
        ],
      }),
    ],
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
    },
    server: {
      watch: {
        // Reference checkouts and browser profiles are not application inputs.
        ignored: ['**/.reference/**'],
      },
      proxy: {
        // Keep browser requests same-origin and avoid forwarding browser Origin to Bilibili.
        '/bili': {
          target: env.VITE_API_BILIBILI_URL || 'https://api.bilibili.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/bili/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyRequest) => {
              proxyRequest.removeHeader('origin')
              proxyRequest.setHeader('referer', 'https://www.bilibili.com/')
              proxyRequest.setHeader(
                'user-agent',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              )
            })
          },
        },
        '/uapi': {
          target: env.VITE_API_UAPI_URL || 'https://uapis.cn',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/uapis/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyRequest) => {
              proxyRequest.removeHeader('origin')
              proxyRequest.setHeader('referer', 'https://uapis.cn')
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
