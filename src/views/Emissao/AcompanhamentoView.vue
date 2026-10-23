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
  { valor: 'ABERTAS', rotulo: 'Em andamento', status: ['PRE_GUIA', 'COM_PENDENCIAS', 'VALIDADA'] },
  { valor: 'COM_PENDENCIAS', rotulo: 'Com pendências', status: ['COM_PENDENCIAS'] },
  { valor: 'REPROVADA', rotulo: 'Reprovadas', status: ['REPROVADA'] },
  { valor: 'TODAS', rotulo: 'Todas', status: null }
]

const preGuias = ref([])
const carregando = ref(false)
const erro = ref('')
const aviso = ref(route.query.salva ? `${numeroPreGuia(route.query.salva)} salva como rascunho.` : '')
const avisoTom = ref('verde')
const filtro = ref('ABERTAS')
const detalhe = ref(null)
const enviando = ref(null)

const lista = computed(() => {
  const status = FILTROS.find(f => f.valor === filtro.value).status
  return status ? preGuias.value.filter(p => status.includes(p.status)) : preGuias.value
})

const comPendencias = computed(() => preGuias.value.filter(p => p.status === 'COM_PENDENCIAS').length)

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    preGuias.value = (await listarPreGuiasDoFluxo()).sort((a, b) => b.id - a.id)
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
                <template v-if="EDITAVEIS.includes(p.status)">
                  <button type="button" class="fx-botao" :disabled="enviando === p.id" @click="enviar(p)">
                    {{ enviando === p.id ? 'Enviando...' : 'Enviar' }}
                  </button>
                  <router-link :to="`/emissor/pre-guias/${p.id}/editar`" class="fx-botao-secundario link-botao">Editar</router-link>
                </template>
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
