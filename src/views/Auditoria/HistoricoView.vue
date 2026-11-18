<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import LinhaDoTempo from '../../components/LinhaDoTempo.vue'
import { api } from '../../services/http.js'
import { traduzirErro } from '../../utils/erros.js'
import { listarEspelhos, historicoDoEspelho } from '../../services/espelhoService.js'
import { formatarMoeda } from '../../utils/avaliarLisura.js'
import { formatarData } from '../../utils/documentos.js'
import { numeroGuia } from '../../utils/fluxoPreGuia.js'
import { traduzirStatusHistorico } from '../../utils/historico.js'

const route = useRoute()

const aba = ref(route.query.espelho ? 'espelhos' : 'guias')
const guias = ref([])
const guiasSemId = ref(0)
const espelhos = ref([])
const carregando = ref(false)
const erro = ref('')
const erroGuias = ref('')
const erroEspelhos = ref('')

const guiaAberta = ref(null)
const linhaDaGuia = ref([])
const espelhoAberto = ref(null)
const historicoEspelho = ref([])
const carregandoHistorico = ref(false)

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    erroGuias.value = ''
    erroEspelhos.value = ''
    const [listaPreGuias, listaEspelhos] = await Promise.allSettled([
      api.get('/pre-guias', { params: { status: 'EMITIDA' } }),
      listarEspelhos({})
    ])
    if (listaPreGuias.status === 'fulfilled') {
      const preGuias = listaPreGuias.value.data
      guias.value = preGuias.filter(g => g.guiaId != null).sort((a, b) => b.guiaId - a.guiaId)
      guiasSemId.value = preGuias.length - guias.value.length
    } else {
      erroGuias.value = traduzirErro(listaPreGuias.reason, { 403: 'Seu perfil não tem acesso à listagem de guias.' }).mensagemUsuario
    }
    if (listaEspelhos.status === 'fulfilled') {
      espelhos.value = listaEspelhos.value.sort((a, b) => b.id - a.id)
    } else {
      erroEspelhos.value = listaEspelhos.reason?.mensagemUsuario || 'Não foi possível carregar os espelhos.'
    }
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível carregar.'
  } finally {
    carregando.value = false
  }
}

async function abrirGuia(guia) {
  carregandoHistorico.value = true
  erro.value = ''
  try {
    const { data } = await api.get(`/guias/${guia.guiaId}/linha-do-tempo`)
    linhaDaGuia.value = Array.isArray(data) ? data : data.eventos ?? []
    guiaAberta.value = guia
  } catch (e) {
    erro.value = traduzirErro(e, { 404: 'Histórico da guia indisponível.' }).mensagemUsuario
  } finally {
    carregandoHistorico.value = false
  }
}

async function abrirEspelho(espelho) {
  carregandoHistorico.value = true
  erro.value = ''
  try {
    historicoEspelho.value = await historicoDoEspelho(espelho.id)
    espelhoAberto.value = espelho
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível carregar o histórico do espelho.'
  } finally {
    carregandoHistorico.value = false
  }
}

onMounted(async () => {
  await carregar()
  if (route.query.espelho) {
    const espelho = espelhos.value.find(e => e.id === Number(route.query.espelho))
    if (espelho) abrirEspelho(espelho)
  }
})
</script>

<template>
  <main class="fx-pagina">
    <div class="fx-conteudo">
      <header>
        <h1 class="fx-titulo">Histórico</h1>
        <p class="fx-subtitulo">A linha do tempo de cada guia emitida e a de cada espelho.</p>
      </header>

      <div class="abas" role="tablist">
        <button
          type="button"
          role="tab"
          class="fx-botao-secundario"
          :class="{ 'aba-ativa': aba === 'guias' }"
          :aria-selected="aba === 'guias'"
          @click="aba = 'guias'"
        >
          Guias
        </button>
        <button
          type="button"
          role="tab"
          class="fx-botao-secundario"
          :class="{ 'aba-ativa': aba === 'espelhos' }"
          :aria-selected="aba === 'espelhos'"
          @click="aba = 'espelhos'"
        >
          Espelhos
        </button>
      </div>

      <p v-if="carregando || carregandoHistorico" class="fx-alerta fx-alerta-cinza">Carregando...</p>
      <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>
      <p v-if="aba === 'guias' && erroGuias" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erroGuias }}</p>
      <p v-if="aba === 'espelhos' && erroEspelhos" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erroEspelhos }}</p>

      <template v-if="aba === 'guias' && !carregando">
        <template v-if="guiaAberta">
          <div>
            <button type="button" class="fx-botao-secundario" @click="guiaAberta = null">← Todas as guias</button>
          </div>
          <section class="fx-cartao">
            <h2 class="fx-secao-titulo">
              Guia <span class="fx-mono">{{ numeroGuia(guiaAberta.guiaId) }}</span> · {{ guiaAberta.beneficiarioNome }}
            </h2>
            <p class="fx-suave">
              Emitida em {{ formatarData(guiaAberta.dataEmissao) }} · {{ guiaAberta.qtdProcedimentos }} procedimento(s)
            </p>
            <LinhaDoTempo :linha-do-tempo="{ eventos: linhaDaGuia }" />
          </section>
        </template>

        <template v-else>
          <p v-if="guiasSemId" class="fx-alerta fx-alerta-ambar">
            {{ guiasSemId }} guia(s) emitida(s) sem identificador não aparecem na lista.
          </p>
          <p v-if="guias.length === 0" class="fx-alerta fx-alerta-cinza">Nenhuma guia emitida.</p>
          <ul class="fx-lista">
            <li v-for="g in guias" :key="g.guiaId">
              <button type="button" class="fx-cartao item" @click="abrirGuia(g)">
                <span><strong class="fx-mono">{{ numeroGuia(g.guiaId) }}</strong> · {{ g.beneficiarioNome }}</span>
                <span class="fx-suave">
                  {{ g.qtdProcedimentos }} procedimento(s) · {{ formatarMoeda(g.valorTotal) }} · emitida em {{ formatarData(g.dataEmissao) }}
                </span>
              </button>
            </li>
          </ul>
        </template>
      </template>

      <template v-if="aba === 'espelhos' && !carregando">
        <template v-if="espelhoAberto">
          <div>
            <button type="button" class="fx-botao-secundario" @click="espelhoAberto = null">← Todos os espelhos</button>
          </div>
          <section class="fx-cartao">
            <h2 class="fx-secao-titulo">
              Espelho <span class="fx-mono">#{{ espelhoAberto.id }}</span> · {{ espelhoAberto.ocsNome }}
            </h2>
            <p v-if="espelhoAberto.motivoReprovacao" class="fx-alerta fx-alerta-vermelho">
              <strong>Motivo da reprovação:</strong> {{ espelhoAberto.motivoReprovacao }}
            </p>
            <LinhaDoTempo :linha-do-tempo="{ eventos: historicoEspelho }" />
          </section>
        </template>

        <template v-else>
          <p v-if="espelhos.length === 0" class="fx-alerta fx-alerta-cinza">Nenhum espelho.</p>
          <ul class="fx-lista">
            <li v-for="e in espelhos" :key="e.id">
              <button type="button" class="fx-cartao item" @click="abrirEspelho(e)">
                <span><strong class="fx-mono">#{{ e.id }}</strong> · {{ e.ocsNome }}</span>
                <span class="fx-suave">
                  {{ formatarData(e.dataInicio) }} a {{ formatarData(e.dataFim) }} · {{ e.quantidadeItens }} atendimento(s) ·
                  {{ formatarMoeda(e.valorTotal) }} · {{ traduzirStatusHistorico(e.status) }}
                </span>
              </button>
            </li>
          </ul>
        </template>
      </template>
    </div>
  </main>
</template>

<style scoped>
.abas {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.aba-ativa {
  background-color: var(--fx-verde-claro);
  border-color: var(--fx-verde);
  color: var(--fx-verde);
}

.item {
  width: 100%;
  align-items: flex-start;
  gap: 0.3rem;
  font-family: inherit;
  font-size: 1rem;
  text-align: left;
  color: var(--fx-texto);
  cursor: pointer;
}

.item:hover {
  border-color: var(--fx-verde);
}
</style>