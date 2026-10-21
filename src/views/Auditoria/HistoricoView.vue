<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import LinhaDoTempo from '../../components/LinhaDoTempo.vue'
import { listarPreGuiasDoFluxo, buscarPreGuiaDoFluxo } from '../../services/fluxoPreGuiaService.js'
import { listarEspelhos, historicoDoEspelho, historicoDoAtendimento } from '../../services/espelhoService.js'
import { formatarMoeda } from '../../utils/avaliarLisura.js'
import { formatarData } from '../../utils/documentos.js'
import { numeroPreGuia } from '../../utils/fluxoPreGuia.js'

const route = useRoute()

const aba = ref(route.query.espelho ? 'espelhos' : 'guias')
const guias = ref([])
const espelhos = ref([])
const carregando = ref(false)
const erro = ref('')

const guiaAberta = ref(null)
const historicosDaGuia = ref({})
const espelhoAberto = ref(null)
const historicoEspelho = ref([])
const carregandoHistorico = ref(false)

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    const [listaGuias, listaEspelhos] = await Promise.all([
      listarPreGuiasDoFluxo({ status: 'EMITIDA' }),
      listarEspelhos()
    ])
    guias.value = listaGuias.sort((a, b) => b.id - a.id)
    espelhos.value = listaEspelhos.sort((a, b) => b.id - a.id)
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível carregar.'
  } finally {
    carregando.value = false
  }
}

async function abrirGuia(id) {
  carregandoHistorico.value = true
  erro.value = ''
  try {
    const guia = await buscarPreGuiaDoFluxo(id)
    const historicos = await Promise.all(guia.procedimentos.map(p => historicoDoAtendimento(p.atendimentoId)))
    historicosDaGuia.value = Object.fromEntries(guia.procedimentos.map((p, i) => [p.atendimentoId, historicos[i]]))
    guiaAberta.value = guia
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível carregar o histórico da guia.'
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
        <p class="fx-subtitulo">Cada mudança de situação das guias (por procedimento) e dos espelhos.</p>
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

      <template v-if="aba === 'guias' && !carregando">
        <template v-if="guiaAberta">
          <div>
            <button type="button" class="fx-botao-secundario" @click="guiaAberta = null">← Todas as guias</button>
          </div>
          <section class="fx-cartao">
            <h2 class="fx-secao-titulo">
              Guia <span class="fx-mono">{{ numeroPreGuia(guiaAberta.id) }}</span> · {{ guiaAberta.beneficiario.nome }}
            </h2>
            <p class="fx-suave">Emitida em {{ formatarData(guiaAberta.dataEmissao) }} · válida até {{ formatarData(guiaAberta.validoAte) }}</p>
          </section>
          <section v-for="p in guiaAberta.procedimentos" :key="p.atendimentoId" class="fx-cartao">
            <h3 class="fx-secao-titulo">{{ p.nome }} <span class="fx-suave">· {{ p.ocs.nome }} · atendimento {{ p.atendimentoId }}</span></h3>
            <LinhaDoTempo :eventos="historicosDaGuia[p.atendimentoId] || []" />
          </section>
        </template>

        <template v-else>
          <p v-if="guias.length === 0" class="fx-alerta fx-alerta-cinza">Nenhuma guia emitida.</p>
          <ul class="fx-lista">
            <li v-for="g in guias" :key="g.id">
              <button type="button" class="fx-cartao item" @click="abrirGuia(g.id)">
                <span><strong class="fx-mono">{{ numeroPreGuia(g.id) }}</strong> · {{ g.beneficiarioNome }}</span>
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
            <LinhaDoTempo :eventos="historicoEspelho" />
          </section>
        </template>

        <template v-else>
          <p v-if="espelhos.length === 0" class="fx-alerta fx-alerta-cinza">Nenhum espelho.</p>
          <ul class="fx-lista">
            <li v-for="e in espelhos" :key="e.id">
              <button type="button" class="fx-cartao item" @click="abrirEspelho(e)">
                <span><strong class="fx-mono">#{{ e.id }}</strong> · {{ e.ocsNome }}</span>
                <span class="fx-suave">Atendimento {{ e.atendimentoId }} · {{ formatarMoeda(e.valorTotal) }} · {{ e.status }}</span>
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
