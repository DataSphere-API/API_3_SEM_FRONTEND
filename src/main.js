import './assets/main.css'
import './assets/tema-fusex.css'
import './assets/tema-telas.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './services/interceptores.js'

createApp(App).use(router).mount('#app')