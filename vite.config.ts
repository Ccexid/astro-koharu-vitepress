import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      include: ['tests/**/*.test.ts'],
    },
    server: {
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
      },
    },
  }
})
