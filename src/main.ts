import { createApp } from 'vue'
import App from './App.vue'
import { router } from './app/router'
import './styles/main.css'
import './styles/theme-toggle.css'
import './styles/theme-transition.css'

createApp(App).use(router).mount('#app')
