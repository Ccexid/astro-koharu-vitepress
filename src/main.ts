import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from '@/app/router'
import '@/styles/main.less'
import { installClientUuidFallback } from '@/utils/id'

installClientUuidFallback()
createApp(App).use(createPinia()).use(router).mount('#app')
