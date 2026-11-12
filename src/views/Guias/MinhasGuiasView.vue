<script setup>
import { onMounted, ref } from 'vue'
import GuiasLista from './components/GuiasLista.vue'
import GuiaDetalhe from './components/GuiaDetalhe.vue'
import { listarGuias, listarPreGuiasDoBeneficiario } from '../../services/guiasService.js'
import { sessao } from '../../stores/sessao.js'
import { rotuloStatus, tomStatus } from '../../utils/guiaRegras.js'

const guias = ref([])
const preGuias = ref([])
const carregando = ref(false)
const erros = ref([])
const guiaSelecionada = ref(null)

async function buscar() {
  const precCp = sessao.usuario?.precCp
  if (!precCp) {
    erros.value = ['O Prec-CP do beneficiário não está disponível na sessão.']
    return
  }

  carregando.value = true
  erros.value = []
  try {
    const [emitidas, solicitadas] = await Promise.allSettled([
      listarGuias(precCp, { usarMock: false }),
      listarPreGuiasDoBeneficiario(precCp)
    ])
    guias.value = emitidas.status === 'fulfilled' ? emitidas.value : []
    preGuias.value = solicitadas.status === 'fulfilled' ? solicitadas.value : []
    if (emitidas.status === 'rejected') {
      erros.value.push(emitidas.reason?.mensagemUsuario || 'Não foi possível carregar as guias.')
    }
    if (solicitadas.status === 'rejected') {
      erros.value.push(solicitadas.reason?.mensagemUsuario || 'Não foi possível carregar as solicitações.')
    }
  } finally {
    carregando.value = false
  }
}

onMounted(buscar)
</script>

<template>
  <main class="fx-pagina">
    <div class="fx-conteudo">
      <header>
        <h1 class="fx-titulo">Minhas guias</h1>
        <p class="fx-subtitulo">Acompanhe o status das guias e o progresso de cada procedimento.</p>
      </header>

      <p v-if="carregando" class="fx-alerta fx-alerta-cinza" role="status">
        Carregando guias...
      </p>

      <template v-else>
        <div v-if="erros.length" class="fx-alerta fx-alerta-vermelho" role="alert">
          <p v-for="(erro, indice) in erros" :key="indice">{{ erro }}</p>
          <button type="button" class="fx-botao-secundario" @click="buscar">Tentar novamente</button>
        </div>

        <section v-if="preGuias.length" aria-labelledby="solicitacoes">
          <h2 id="solicitacoes" class="fx-secao-titulo">Solicitações</h2>
          <ul class="fx-lista">
            <li v-for="(preGuia, indice) in preGuias" :key="preGuia.preGuiaId ?? preGuia.id ?? indice" class="fx-cartao">
              <div class="solicitacao-topo">
                <span>Pré-guia {{ preGuia.numero || preGuia.preGuiaId || preGuia.id || '' }}</span>
                <span class="fx-selo" :class="'fx-selo-' + tomStatus('SOLICITADA')">
                  {{ rotuloStatus('SOLICITADA') }}
                </span>
              </div>
            </li>
          </ul>
        </section>

        <GuiasLista v-if="guias.length" :guias="guias" @abrir-guia="guiaSelecionada = $event" />
        <p v-else-if="!erros.length && !preGuias.length" class="fx-alerta fx-alerta-cinza">
          Nenhuma guia ou solicitação encontrada para este beneficiário.
        </p>
      </template>
    </div>

    <GuiaDetalhe
      :aberto="guiaSelecionada !== null"
      :guia="guiaSelecionada"
      @fechar="guiaSelecionada = null"
    />
  </main>
</template>

<style scoped>
.solicitacao-topo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}
</style>
