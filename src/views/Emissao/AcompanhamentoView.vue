<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PreGuiaResumo from '../../components/PreGuiaResumo.vue'
import {
  listarPreGuiasDoFluxo,
  buscarPreGuiaDoFluxo,
  enviarParaAprovacao
} from '../../services/fluxoPreGuiaService.js'
import { formatarMoeda } from '../../utils/avaliarLisura.js'
import { formatarData } from '../../utils/documentos.js'
import { EDITAVEIS, numeroPreGuia, seloAprovacao, seloStatus } from '../../utils/fluxoPreGuia.js'

const route = useRoute()

const FILTROS = [
  { valor: 'TODAS', rotulo: 'Todas', status: null },
  { valor: 'ABERTAS', rotulo: 'Em andamento', status: ['PRE_GUIA', 'COM_PENDENCIAS', 'VALIDADA'] },
  { valor: 'COM_PENDENCIAS', rotulo: 'Com pendências', status: ['COM_PENDENCIAS'] },
  { valor: 'REPROVADA', rotulo: 'Reprovadas', status: ['REPROVADA'] }
]

const PRIORIDADE_STATUS = {
  COM_PENDENCIAS: 1,
  PRE_GUIA: 2,
  VALIDADA: 3,
  REPROVADA: 4,
  APROVADA: 5,
  EMITIDA: 6
}

const preGuias = ref([])
const carregando = ref(false)
const erro = ref('')
const aviso = ref(route.query.salva ? `${numeroPreGuia(route.query.salva)} salva como rascunho.` : '')
const avisoTom = ref('verde')
const filtro = ref('TODAS')
const termoBusca = ref('')
const detalhe = ref(null)
const enviando = ref(null)

function pesoPrioridade(status) {
  return PRIORIDADE_STATUS[status] ?? 99
}

const lista = computed(() => {
  const statusPermitidos = FILTROS.find(f => f.valor === filtro.value).status
  const busca = termoBusca.value.toLowerCase().trim()

  return preGuias.value
    .filter(p => {
      if (statusPermitidos && !statusPermitidos.includes(p.status)) return false
      if (!busca) return true

      const nome = (p.beneficiarioNome || p.beneficiario?.nome || '').toLowerCase()
      const precCp = (p.beneficiarioPrecCp || p.beneficiario?.precCp || p.precCp || '').toLowerCase()
      return nome.includes(busca) || precCp.includes(busca)
    })
    .sort((a, b) => {
      const diffPrioridade = pesoPrioridade(a.status) - pesoPrioridade(b.status)
      if (diffPrioridade !== 0) return diffPrioridade
      return b.id - a.id
    })
})

const comPendencias = computed(() => preGuias.value.filter(p => p.status === 'COM_PENDENCIAS').length)

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    preGuias.value = await listarPreGuiasDoFluxo()
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível carregar as pré-guias.'
  } finally {
    carregando.value = false
  }
}

async function enviar(p) {
  aviso.value = ''
  enviando.value = p.id
  try {
    const resultado = await enviarParaAprovacao(p.id)
    avisoTom.value = resultado.validada ? 'verde' : 'ambar'
    aviso.value = resultado.validada
      ? `${numeroPreGuia(p.id)} enviada para o Médico e para o Chefe do FUSEx.`
      : `${numeroPreGuia(p.id)} ficou com pendências: ${resultado.pendencias.map(x => x.mensagem).join('; ')}.`
    detalhe.value = null
    await carregar()
  } catch (e) {
    avisoTom.value = 'vermelho'
    aviso.value = e.mensagemUsuario || 'Não foi possível enviar.'
  } finally {
    enviando.value = null
  }
}

async function abrirDetalhe(id) {
  try {
    detalhe.value = await buscarPreGuiaDoFluxo(id)
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível abrir a pré-guia.'
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
          <p class="fx-subtitulo">Rascunhos, pendências e a situação de cada pré-guia com o Médico e o Chefe do FUSEx.</p>
        </div>
        <router-link to="/emissor/pre-guias/nova" class="fx-botao link-botao">Criar pré-guia</router-link>
      </header>

      <p v-if="aviso" class="fx-alerta" :class="`fx-alerta-${avisoTom}`" role="status">{{ aviso }}</p>
      <p v-if="comPendencias" class="fx-alerta fx-alerta-ambar">
        {{ comPendencias }} pré-guia(s) com pendências aguardando sua correção.
      </p>

      <div class="barra-controles">
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

        <div class="busca-container">
          <div class="input-com-icone">
            <svg class="icone-busca" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              v-model="termoBusca"
              type="text"
              class="fx-entrada input-busca-largo"
              placeholder="Pesquisar por nome do beneficiário ou Prec-CP completo..."
            />
          </div>
          <button
            v-if="termoBusca"
            type="button"
            class="fx-botao-secundario"
            @click="termoBusca = ''"
          >
            Limpar
          </button>
        </div>
      </div>

      <p v-if="carregando" class="fx-alerta fx-alerta-cinza">Carregando pré-guias...</p>
      <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>

      <div v-if="!carregando && !erro" class="fx-tabela-rolagem">
        <table class="fx-tabela">
          <thead>
            <tr>
              <th>Pré-guia</th>
              <th>Beneficiário</th>
              <th>Procedimentos</th>
              <th>Criada</th>
              <th>Médico</th>
              <th>Chefe do FUSEx</th>
              <th>Situação</th>
              <th><span class="fx-suave">Ação</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in lista" :key="p.id">
              <td class="fx-mono">{{ numeroPreGuia(p.id) }}</td>
              <td>{{ p.beneficiarioNome }}</td>
              <td>{{ p.qtdProcedimentos }} · {{ formatarMoeda(p.valorTotal) }}</td>
              <td>{{ formatarData(p.dataCriacao) }}</td>
              <td>
                <span class="fx-selo" :class="seloAprovacao(p.status, p.medicoAprovou).classe">
                  {{ seloAprovacao(p.status, p.medicoAprovou).texto }}
                </span>
              </td>
              <td>
                <span class="fx-selo" :class="seloAprovacao(p.status, p.chefeAprovou).classe">
                  {{ seloAprovacao(p.status, p.chefeAprovou).texto }}
                </span>
              </td>
              <td>
                <span class="fx-selo" :class="seloStatus(p.status).classe">{{ seloStatus(p.status).texto }}</span>
              </td>
              <td class="acoes">
                <button type="button" class="fx-botao-secundario" @click="abrirDetalhe(p.id)">Detalhes</button>
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

          <div v-if="EDITAVEIS.includes(detalhe.status)" class="modal-rodape-acoes">
            <router-link
              :to="`/emissor/pre-guias/${detalhe.id}/editar`"
              class="fx-botao-secundario link-botao"
            >
              Editar
            </router-link>
            <button
              type="button"
              class="fx-botao"
              :class="{ 'btn-destaque-atencao': detalhe.status === 'COM_PENDENCIAS' }"
              :disabled="enviando === detalhe.id"
              @click="enviar(detalhe)"
            >
              {{ enviando === detalhe.id ? 'Processando...' : (detalhe.status === 'COM_PENDENCIAS' ? 'Corrigir e Enviar' : 'Enviar') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.barra-controles {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.filtros {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.busca-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1 1 350px;
  max-width: 500px;
}

.input-com-icone {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.icone-busca {
  position: absolute;
  left: 12px;
  color: var(--fx-texto-suave, #666);
  pointer-events: none;
}

.input-busca-largo {
  width: 100%;
  padding-left: 36px !important;
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

.modal-rodape-acoes {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--fx-borda);
}

.btn-destaque-atencao {
  animation: pulse-soft 2s infinite;
  font-weight: 600;
}

@keyframes pulse-soft {
  0% { opacity: 1; }
  50% { opacity: 0.85; transform: scale(1.02); }
  100% { opacity: 1; }
}
</style>