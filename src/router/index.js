import { createRouter, createWebHistory } from 'vue-router'
import EspelhosViews from '../views/Espelhos/EspelhosViews.vue'
import CriarEspelhoView from '../views/Espelhos/CriarEspelhoView.vue'
import FaturasViews from '../views/Faturas/FaturasViews.vue'
import MinhasGuiasView from '../views/Guias/MinhasGuiasView.vue'
import AtendimentoView from '../views/Atendimentos/AtendimentoView.vue'
import PreGuiasView from '../views/PreGuias/PreGuiasView.vue'
import LoginView from '../views/Acesso/LoginView.vue'
import EscolherPerfilView from '../views/Acesso/EscolherPerfilView.vue'
import CadastroBeneficiarioView from '../views/Acesso/CadastroBeneficiarioView.vue'
import UsuariosView from '../views/Usuarios/UsuariosView.vue'
import OcsView from '../views/Ocs/OcsView.vue'
import ContratosView from '../views/Contratos/ContratosView.vue'
import AprovacaoView from '../views/Aprovacao/AprovacaoView.vue'
import SolicitacaoView from '../views/Emissao/SolicitacaoView.vue'
import AcompanhamentoView from '../views/Emissao/AcompanhamentoView.vue'
import AprovadasView from '../views/Emissao/AprovadasView.vue'
import AtendimentosOcsView from '../views/Atendimentos/AtendimentosOcsView.vue'
import ConfirmarAtendimentoView from '../views/Guias/ConfirmarAtendimentoView.vue'
import { sessao } from '../stores/sessao.js'
import { PERFIS } from '../utils/perfis.js'

function rotaInicial() {
  if (!sessao.token) return '/login'
  if (!sessao.perfilAtivo) return '/escolher-perfil'
  return PERFIS[sessao.perfilAtivo].rotaInicial
}

const routes = [
  { path: '/', redirect: rotaInicial },
  { path: '/login', name: 'login', component: LoginView, meta: { publica: true } },
  { path: '/cadastro', name: 'cadastro', component: CadastroBeneficiarioView, meta: { publica: true } },
  { path: '/escolher-perfil', name: 'escolher-perfil', component: EscolherPerfilView },

  { path: '/espelhos', name: 'espelhos', component: EspelhosViews, meta: { perfis: ['OCS'] } },
  { path: '/espelhos/novo', name: 'espelhos-novo', component: CriarEspelhoView, meta: { perfis: ['OCS'] } },
  { path: '/faturas', name: 'faturas', component: FaturasViews, meta: { perfis: ['AUDITOR'] } },
  { path: '/beneficiario/minhas-guias', name: 'minhas-guias', component: MinhasGuiasView, meta: { perfis: ['BENEFICIARIO'] } },
  { path: '/ocs/atendimento-qr', name: 'atendimento', component: AtendimentoView, meta: { perfis: ['OCS'] } },
  { path: '/chefe/pre-guias', name: 'pre-guias', component: PreGuiasView, meta: { perfis: ['CHEFE'] } },

  { path: '/chefe/aprovacao', name: 'aprovacao-chefe', component: AprovacaoView, meta: { perfis: ['CHEFE'] } },
  { path: '/medico/aprovacao', name: 'aprovacao-medico', component: AprovacaoView, meta: { perfis: ['MEDICO'] } },
  { path: '/chefe/usuarios', name: 'usuarios', component: UsuariosView, meta: { perfis: ['CHEFE'] } },
  { path: '/chefe/ocs', name: 'ocs', component: OcsView, meta: { perfis: ['CHEFE'] } },
  { path: '/chefe/contratos', name: 'contratos', component: ContratosView, meta: { perfis: ['CHEFE'] } },
  { path: '/medico/nova-solicitacao', name: 'nova-solicitacao', component: SolicitacaoView, meta: { perfis: ['MEDICO'] } },
  { path: '/emissor/pre-guias/nova', name: 'criar-pre-guia', component: SolicitacaoView, meta: { perfis: ['EMISSOR'] } },
  { path: '/emissor/pre-guias/:id/editar', name: 'editar-pre-guia', component: SolicitacaoView, meta: { perfis: ['EMISSOR'] } },
  { path: '/emissor/acompanhamento', name: 'acompanhamento', component: AcompanhamentoView, meta: { perfis: ['EMISSOR'] } },
  { path: '/emissor/aprovadas', name: 'aprovadas', component: AprovadasView, meta: { perfis: ['EMISSOR'] } },
  { path: '/ocs/atendimentos', name: 'atendimentos-ocs', component: AtendimentosOcsView, meta: { perfis: ['OCS'] } },
  { path: '/beneficiario/confirmar-atendimento', name: 'confirmar-atendimento', component: ConfirmarAtendimentoView, meta: { perfis: ['BENEFICIARIO'] } },

  { path: '/:caminho(.*)*', redirect: rotaInicial }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(to => {
  if (to.meta.publica) {
    return sessao.token && sessao.perfilAtivo ? rotaInicial() : true
  }
  if (!sessao.token) {
    return { name: 'login', query: { voltar: to.fullPath } }
  }
  if (!sessao.perfilAtivo) {
    return to.name === 'escolher-perfil' ? true : { name: 'escolher-perfil' }
  }
  if (to.meta.perfis && !to.meta.perfis.includes(sessao.perfilAtivo)) {
    return rotaInicial()
  }
  return true
})

export default router
