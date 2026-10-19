import { createRouter, createWebHistory } from 'vue-router'
import EspelhosViews from '../views/Espelhos/EspelhosViews.vue'
import CriarEspelhoView from '../views/Espelhos/CriarEspelhoView.vue'
import FaturasViews from '../views/Faturas/FaturasViews.vue'
import MinhasGuiasView from '../views/Guias/MinhasGuiasView.vue'

const routes = [
  { path: '/', redirect: '/espelhos' },
  { path: '/espelhos', name: 'espelhos', component: EspelhosViews },
  { path: '/espelhos/novo', name: 'espelhos-novo', component: CriarEspelhoView },
  { path: '/faturas', name: 'faturas', component: FaturasViews },
  { path: '/minhas-guias', name: 'minhas-guias', component: MinhasGuiasView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router