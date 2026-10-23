<script setup>
import { ref, computed, onMounted } from 'vue'
import PreGuiasLista from './components/PreGuiasLista.vue'
import PreGuiaDetalhe from './components/PreGuiaDetalhe.vue'
import { listarPreGuias, buscarPreGuia } from '../../services/preGuiaService.js'

const preGuias = ref([])
const carregando = ref(false)
const erro = ref('')
const filtroStatus = ref('TODAS')
const idGuiaSelecionada = ref(null)
const guiaDetalhe = ref(null)

const filtros = [
  { label: 'Todas', valor: 'TODAS' },
  { label: 'Com pendências', valor: 'COM_PENDENCIAS' },
  { label: 'Validadas', valor: 'VALIDADA' },
  { label: 'Aprovadas', valor: 'APROVADA' },
  { label: 'Reprovadas', valor: 'REPROVADA' },
  { label: 'Emitidas', valor: 'EMITIDA' }
]

async function carregarLista() {
  carregando.value = true
  erro.value = ''
  try {
    preGuias.value = await listarPreGuias()
  } catch (err) {
    erro.value = err.mensagemUsuario || 'Não foi possível carregar as pré-guias.'
  } finally {
    carregando.value = false
  }
}

async function abrirDetalhe(id) {
  idGuiaSelecionada.value = id
  try {
    guiaDetalhe.value = await buscarPreGuia(id)
  } catch (err) {
    erro.value = err.mensagemUsuario || 'Erro ao carregar detalhes da pré-guia.'
  }
}

function fecharDetalhe() {
  idGuiaSelecionada.value = null
  guiaDetalhe.value = null
  carregarLista()
}

const preGuiasFiltradas = computed(() => {
  if (filtroStatus.value === 'TODAS') {
    return preGuias.value
  }
  return preGuias.value.filter(g => g.status === filtroStatus.value)
})

onMounted(() => {
  carregarLista()
})
</script>

<template>
  <main class="fx-pagina">
    <div class="fx-conteudo">
      <header>
        <h1 class="fx-titulo">Gerenciamento de Pré-Guias</h1>
        <p class="fx-subtitulo">Visualização e aprovação de pré-guias para o SIRE.</p>
      </header>

      <div v-if="!idGuiaSelecionada">
        <div class="filtros-barra">
          <button
            v-for="f in filtros"
            :key="f.valor"
            type="button"
            class="fx-botao-secundario"
            :class="{ 'filtro-ativo': filtroStatus === f.valor }"
            @click="filtroStatus = f.valor"
          >
            {{ f.label }}
          </button>
        </div>

        <p v-if="carregando" class="fx-alerta fx-alerta-cinza">Carregando pré-guias...</p>
        <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>

        <PreGuiasLista
          v-if="!carregando && !erro"
          :pre-guias="preGuiasFiltradas"
          @abrir="abrirDetalhe"
        />
      </div>

      <div v-else>
        <button type="button" class="fx-botao-secundario" @click="fecharDetalhe">
          ← Voltar para a lista
        </button>

        <PreGuiaDetalhe
          v-if="guiaDetalhe"
          :pre-guia="guiaDetalhe"
          @atualizar="abrirDetalhe(idGuiaSelecionada)"
        />
      </div>
    </div>
  </main>
</template>

<style scoped>
.filtros-barra {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}
.filtro-ativo {
  background-color: var(--fx-verde-claro);
  border-color: var(--fx-verde);
  color: var(--fx-verde);
  font-weight: 700;
}
</style>