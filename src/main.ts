import { createApp } from 'vue'
import App from './App.vue'
import { router } from '@/app/router'
import '@/styles/main.less'

createApp(App).use(router).mount('#app')
