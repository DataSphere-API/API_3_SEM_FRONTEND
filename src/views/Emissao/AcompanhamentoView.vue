<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PreGuiaResumo from '../../components/PreGuiaResumo.vue'
import { listarPreGuiasDoFluxo } from '../../services/fluxoPreGuiaService.js'
import { formatarData } from '../../utils/documentos.js'
import { seloDecisao, seloStatus } from '../../utils/fluxoPreGuia.js'

const route = useRoute()

const FILTROS = [
  { valor: 'ABERTAS', rotulo: 'Em andamento' },
  { valor: 'DEVOLVIDA', rotulo: 'Devolvidas' },
  { valor: 'REPROVADA', rotulo: 'Negadas' },
  { valor: 'TODAS', rotulo: 'Todas' }
]

const preGuias = ref([])
const carregando = ref(false)
const erro = ref('')
const filtro = ref('ABERTAS')
const detalhe = ref(null)

const lista = computed(() => {
  if (filtro.value === 'TODAS') return preGuias.value
  if (filtro.value === 'ABERTAS') {
    return preGuias.value.filter(p => ['AGUARDANDO_APROVACAO', 'DEVOLVIDA'].includes(p.status))
  }
  return preGuias.value.filter(p => p.status === filtro.value)
})

const devolvidas = computed(() => preGuias.value.filter(p => p.status === 'DEVOLVIDA').length)

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    preGuias.value = (await listarPreGuiasDoFluxo()).sort((a, b) => b.criadaEm.localeCompare(a.criadaEm))
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível carregar as pré-guias.'
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <main class="fx-pagina">
    <div class="fx-conteudo fx-conteudo-largo">
      <header class="fx-topo-pagina">
        <div>
          <h1 class="fx-titulo">Acompanhamento das pré-guias</h1>
          <p class="fx-subtitulo">Situação de cada pré-guia com o Médico e com o Chefe do FUSEx.</p>
        </div>
        <router-link to="/emissor/pre-guias/nova" class="fx-botao link-botao">Criar pré-guia</router-link>
      </header>

      <p v-if="route.query.reenviada" class="fx-alerta fx-alerta-verde" role="status">
        Pré-guia {{ route.query.reenviada }} corrigida e reenviada para aprovação.
      </p>
      <p v-if="devolvidas" class="fx-alerta fx-alerta-ambar">
        {{ devolvidas }} pré-guia(s) devolvida(s) aguardando sua correção.
      </p>

      <div class="filtros">
        <button
          v-for="f in FILTROS"
          :key="f.valor"
          type="button"
          class="fx-botao-secundario"
          :class="{ 'filtro-ativo': filtro === f.valor }"
          @click="filtro = f.valor"
        >
          {{ f.rotulo }}
        </button>
      </div>

      <p v-if="carregando" class="fx-alerta fx-alerta-cinza">Carregando pré-guias...</p>
      <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>

      <div v-if="!carregando && !erro" class="fx-tabela-rolagem">
        <table class="fx-tabela">
          <thead>
            <tr>
              <th>Pré-guia</th>
              <th>Beneficiário</th>
              <th>Exame</th>
              <th>Enviada</th>
              <th>Médico</th>
              <th>Chefe do FUSEx</th>
              <th>Situação</th>
              <th><span class="fx-suave">Ação</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in lista" :key="p.id">
              <td class="fx-mono">{{ p.numero }}</td>
              <td>{{ p.beneficiario.nome }}</td>
              <td>{{ p.procedimentos.map(x => x.nome).join(', ') }}</td>
              <td>{{ formatarData(p.criadaEm) }}</td>
              <td>
                <span class="fx-selo" :class="seloDecisao(p.aprovacaoMedico.decisao).classe">
                  {{ seloDecisao(p.aprovacaoMedico.decisao).texto }}
                </span>
              </td>
              <td>
                <span class="fx-selo" :class="seloDecisao(p.aprovacaoChefe.decisao).classe">
                  {{ seloDecisao(p.aprovacaoChefe.decisao).texto }}
                </span>
              </td>
              <td>
                <span class="fx-selo" :class="seloStatus(p.status).classe">{{ seloStatus(p.status).texto }}</span>
              </td>
              <td class="acoes">
                <router-link
                  v-if="p.status === 'DEVOLVIDA'"
                  :to="`/emissor/pre-guias/${p.id}/corrigir`"
                  class="fx-botao link-botao"
                >
                  Corrigir
                </router-link>
                <button type="button" class="fx-botao-secundario" @click="detalhe = p">Detalhes</button>
              </td>
            </tr>
            <tr v-if="lista.length === 0">
              <td colspan="8" class="fx-suave">Nenhuma pré-guia neste filtro.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="detalhe" class="fx-modal-fundo" @click.self="detalhe = null">
      <div class="fx-modal fx-modal-largo">
        <div class="fx-modal-topo">
          <h2>Detalhes da pré-guia</h2>
          <button type="button" class="fx-fechar" aria-label="Fechar" @click="detalhe = null">&times;</button>
        </div>
        <div class="fx-modal-corpo">
          <PreGuiaResumo :pre-guia="detalhe" />
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.filtros {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filtro-ativo {
  background-color: var(--fx-verde-claro);
  border-color: var(--fx-verde);
  color: var(--fx-verde);
}

.acoes {
  display: flex;
  gap: 0.5rem;
  white-space: nowrap;
}

.link-botao {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}
</style>
