import { createRouter, createWebHistory } from 'vue-router'
import EspelhosViews from '../views/Espelhos/EspelhosViews.vue'
import CriarEspelhoView from '../views/Espelhos/CriarEspelhoView.vue'
import FaturasViews from '../views/Faturas/FaturasViews.vue'

const routes = [
  { path: '/', redirect: '/espelhos' },
  { path: '/espelhos', name: 'espelhos', component: EspelhosViews },
  { path: '/espelhos/novo', name: 'espelhos-novo', component: CriarEspelhoView },
  { path: '/faturas', name: 'faturas', component: FaturasViews }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router