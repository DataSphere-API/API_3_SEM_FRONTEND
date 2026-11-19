<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { criarEspelho } from '../../services/espelhoService.js'
import { sessao } from '../../stores/sessao.js'
import { formatarMoeda } from '../../utils/avaliarLisura.js'
import { formatarData } from '../../utils/documentos.js'
import {
  competenciaDe,
  competenciasAbertasParaEspelho,
  DIAS_DE_TOLERANCIA,
  hojeIso,
  primeiroDiaDe,
  rotuloCompetencia,
  ultimoDiaDe
} from '../../utils/competencia.js'

const router = useRouter()
const cnpj = sessao.usuario?.ocsCnpj || ''

const hoje = hojeIso()
const abertas = competenciasAbertasParaEspelho()
const mes = ref(abertas[abertas.length - 1])
const inicioDoMes = computed(() => primeiroDiaDe(mes.value))
const fimDoMes = computed(() => (ultimoDiaDe(mes.value) < hoje ? ultimoDiaDe(mes.value) : hoje))
const dataInicio = ref(inicioDoMes.value)
const dataFim = ref(fimDoMes.value)

function trocarMes() {
  dataInicio.value = inicioDoMes.value
  dataFim.value = fimDoMes.value
}

const atendimentos = ref([])
const selecionados = ref({})
const valores = ref({})
const carregando = ref(false)
const erro = ref('')
const enviando = ref(false)

const disponiveis = computed(() =>
  atendimentos.value.filter(a => {
    if (a.statusProcedimento !== 'REALIZADA' || a.espelhoId || !a.dataRealizacao) return false
    const dia = a.dataRealizacao.slice(0, 10)
    return dia >= dataInicio.value && dia <= dataFim.value
  })
)

const deMesesAnteriores = computed(
  () =>
    atendimentos.value.filter(
      a => a.statusProcedimento === 'REALIZADA' && !a.espelhoId && a.dataRealizacao && competenciaDe(a.dataRealizacao) < abertas[0]
    ).length
)

const escolhidos = computed(() => disponiveis.value.filter(a => selecionados.value[a.atendimentoId]))
const total = computed(() => escolhidos.value.reduce((soma, a) => soma + (Number(valores.value[a.atendimentoId]) || 0), 0))

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    atendimentos.value = []
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível carregar os atendimentos.'
  } finally {
    carregando.value = false
  }
}

async function enviar() {
  erro.value = ''
  if (dataFim.value < dataInicio.value) {
    erro.value = 'O fim do período não pode ser antes do início.'
    return
  }
  if (dataInicio.value < inicioDoMes.value || dataFim.value > fimDoMes.value) {
    erro.value = `O período precisa ficar dentro de ${rotuloCompetencia(mes.value)}, até hoje.`
    return
  }
  if (escolhidos.value.length === 0) {
    erro.value = 'Marque pelo menos um atendimento.'
    return
  }
  if (escolhidos.value.some(a => !(Number(valores.value[a.atendimentoId]) > 0))) {
    erro.value = 'Informe o valor cobrado de todos os atendimentos marcados.'
    return
  }

  enviando.value = true
  try {
    await criarEspelho({
      ocsId: cnpj,
      dataInicio: dataInicio.value,
      dataFim: dataFim.value,
      itens: escolhidos.value.map(a => ({ atendimentoId: a.atendimentoId, valor: Number(valores.value[a.atendimentoId]) }))
    })
    router.push('/ocs/espelhos')
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível enviar o espelho.'
  } finally {
    enviando.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <main class="fx-pagina">
    <form class="fx-conteudo fx-conteudo-largo" novalidate @submit.prevent="enviar">
      <div>
        <router-link to="/ocs/espelhos" class="voltar">← Voltar</router-link>
      </div>
      <header>
        <h1 class="fx-titulo">Novo espelho</h1>
        <p class="fx-subtitulo">
          O espelho junta os atendimentos de um mês e entra na fatura desse mês. Informe quanto a clínica cobra por cada um.
        </p>
      </header>

      <section class="fx-cartao">
        <h2 class="fx-secao-titulo">1. Mês e período</h2>
        <p v-if="abertas.length > 1" class="fx-alerta fx-alerta-cinza">
          Até o dia {{ DIAS_DE_TOLERANCIA }} ainda dá para mandar espelho de {{ rotuloCompetencia(abertas[0]) }}.
        </p>
        <div class="fx-grade">
          <label class="fx-campo">
            Mês do espelho
            <select v-model="mes" class="fx-entrada" :disabled="abertas.length === 1" @change="trocarMes">
              <option v-for="c in abertas" :key="c" :value="c">{{ rotuloCompetencia(c) }}</option>
            </select>
          </label>
          <label class="fx-campo">
            De
            <input v-model="dataInicio" type="date" class="fx-entrada" :min="inicioDoMes" :max="fimDoMes" />
          </label>
          <label class="fx-campo">
            Até
            <input v-model="dataFim" type="date" class="fx-entrada" :min="inicioDoMes" :max="fimDoMes" />
          </label>
        </div>
      </section>

      <section class="fx-cartao">
        <h2 class="fx-secao-titulo">2. Atendimentos realizados no período</h2>
        <p class="fx-suave">Validação via QR Code ativa.</p>
        <p v-if="carregando" class="fx-alerta fx-alerta-cinza">Carregando atendimentos...</p>
        <p v-else-if="disponiveis.length === 0" class="fx-alerta fx-alerta-cinza">
          Nenhum atendimento realizado neste período.
        </p>
      </section>

      <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>

      <div class="rodape">
        <strong>{{ escolhidos.length }} atendimento(s) · Total: <span class="fx-mono">{{ formatarMoeda(total) }}</span></strong>
        <div class="fx-acoes">
          <router-link to="/ocs/espelhos" class="fx-botao-secundario link-botao">Cancelar</router-link>
          <button type="submit" class="fx-botao" :disabled="enviando || carregando">
            {{ enviando ? 'Enviando...' : 'Enviar espelho para auditoria' }}
          </button>
        </div>
      </div>
    </form>
  </main>
</template>

<style scoped>
.voltar { color: var(--fx-verde); font-weight: 600; }
.marcar { width: 20px; height: 20px; }
.campo-valor { width: 140px; }
.rodape { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem; }
.link-botao { display: inline-flex; align-items: center; text-decoration: none; }
</style>