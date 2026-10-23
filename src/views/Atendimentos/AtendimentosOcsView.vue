<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { listarAtendimentosDaOcs, registrarSessao, cancelarSessao } from '../../services/checkMutuoService.js'
import { sessao } from '../../stores/sessao.js'
import { formatarData } from '../../utils/documentos.js'

const ATUALIZAR_A_CADA_MS = 8000

const FILTROS = [
  { valor: 'ABERTOS', rotulo: 'A realizar' },
  { valor: 'AGUARDANDO', rotulo: 'Aguardando beneficiário' },
  { valor: 'REALIZADA', rotulo: 'Realizados' },
  { valor: 'TODOS', rotulo: 'Todos' }
]

const cnpj = sessao.usuario?.ocsCnpj
const atendimentos = ref([])
const carregando = ref(false)
const erro = ref('')
const aviso = ref('')
const erroAcao = ref('')
const processando = ref(null)
const busca = ref('')
const filtro = ref('ABERTOS')
let temporizador = null

const lista = computed(() => {
  const termo = busca.value.trim().toLowerCase()
  return atendimentos.value
    .filter(a => {
      if (filtro.value === 'ABERTOS') return a.statusProcedimento !== 'REALIZADA' && !a.aguardandoConfirmacao
      if (filtro.value === 'AGUARDANDO') return a.aguardandoConfirmacao
      if (filtro.value === 'REALIZADA') return a.statusProcedimento === 'REALIZADA'
      return true
    })
    .filter(
      a =>
        !termo ||
        a.beneficiario.nome.toLowerCase().includes(termo) ||
        a.beneficiario.precCp.includes(termo) ||
        a.guiaNumero.toLowerCase().includes(termo)
    )
})

const aguardando = computed(() => atendimentos.value.filter(a => a.aguardandoConfirmacao).length)

async function carregar(silencioso = false) {
  if (!silencioso) carregando.value = true
  try {
    atendimentos.value = await listarAtendimentosDaOcs(cnpj)
    erro.value = ''
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível carregar os atendimentos.'
  } finally {
    carregando.value = false
  }
}

async function realizar(atendimento) {
  aviso.value = ''
  erroAcao.value = ''
  processando.value = atendimento.atendimentoId
  try {
    await registrarSessao(atendimento.atendimentoId, cnpj)
    aviso.value = `Pedido enviado para ${atendimento.beneficiario.nome}. A sessão só conta depois que ele confirmar no app.`
    await carregar(true)
  } catch (e) {
    erroAcao.value = e.mensagemUsuario || 'Não foi possível registrar o procedimento.'
  } finally {
    processando.value = null
  }
}

async function cancelar(atendimento) {
  aviso.value = ''
  erroAcao.value = ''
  processando.value = atendimento.atendimentoId
  try {
    await cancelarSessao(atendimento.atendimentoId)
    aviso.value = 'Pedido de confirmação cancelado.'
    await carregar(true)
  } catch (e) {
    erroAcao.value = e.mensagemUsuario || 'Não foi possível cancelar o pedido.'
  } finally {
    processando.value = null
  }
}

function situacao(a) {
  if (a.statusProcedimento === 'REALIZADA') return { texto: 'Realizado', classe: 'fx-selo-verde' }
  if (a.aguardandoConfirmacao) return { texto: 'Aguardando beneficiário', classe: 'fx-selo-ambar' }
  if (a.qtdRealizada > 0) return { texto: 'Em andamento', classe: 'fx-selo-azul' }
  return { texto: 'A realizar', classe: 'fx-selo-cinza' }
}

onMounted(() => {
  carregar()
  // Atualiza sozinho para a OCS ver a confirmação do beneficiário sem recarregar.
  temporizador = setInterval(() => carregar(true), ATUALIZAR_A_CADA_MS)
})

onUnmounted(() => clearInterval(temporizador))
</script>

<template>
  <main class="fx-pagina">
    <div class="fx-conteudo fx-conteudo-largo">
      <header>
        <h1 class="fx-titulo">Atendimentos</h1>
        <p class="fx-subtitulo">
          Clique em <strong>Realizar procedimento</strong> na hora do atendimento. O beneficiário confirma
          no app dele e só então a sessão conta.
        </p>
      </header>

      <p v-if="!cnpj" class="fx-alerta fx-alerta-vermelho" role="alert">
        Seu usuário não está vinculado a nenhuma OCS. Peça à Chefia do FUSEx para corrigir o cadastro.
      </p>

      <template v-else>
        <p v-if="aviso" class="fx-alerta fx-alerta-verde" role="status">{{ aviso }}</p>
        <p v-if="erroAcao" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erroAcao }}</p>

        <div class="barra">
          <label class="fx-campo">
            Buscar
            <input v-model="busca" class="fx-entrada" placeholder="Nome, Prec-CP ou nº da guia" />
          </label>
          <div class="filtros">
            <button
              v-for="f in FILTROS"
              :key="f.valor"
              type="button"
              class="fx-botao-secundario"
              :class="{ 'filtro-ativo': filtro === f.valor }"
              @click="filtro = f.valor"
            >
              {{ f.rotulo }}<template v-if="f.valor === 'AGUARDANDO' && aguardando"> ({{ aguardando }})</template>
            </button>
          </div>
        </div>

        <p v-if="carregando" class="fx-alerta fx-alerta-cinza">Carregando atendimentos...</p>
        <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>
        <p v-if="!carregando && !erro && lista.length === 0" class="fx-alerta fx-alerta-cinza">
          Nenhum atendimento neste filtro.
        </p>
        <p v-if="filtro === 'REALIZADA'" class="fx-suave">
          Para cobrar um atendimento realizado, use o número do atendimento em Espelhos → Novo espelho.
        </p>

        <ul v-if="!carregando && !erro" class="fx-lista">
          <li v-for="a in lista" :key="a.atendimentoId" class="fx-cartao">
            <div class="topo">
              <span>
                <strong>{{ a.beneficiario.nome }}</strong>
                <span class="fx-suave fx-mono"> · Prec-CP {{ a.beneficiario.precCp }}</span>
              </span>
              <span class="fx-selo" :class="situacao(a).classe">{{ situacao(a).texto }}</span>
            </div>
            <p class="linha">
              {{ a.procedimento }}
              <span class="fx-suave">
                · Atendimento <span class="fx-mono">{{ a.atendimentoId }}</span>
                · Guia <span class="fx-mono">{{ a.guiaNumero }}</span>
                · válida até {{ formatarData(a.dataValidade) }}
              </span>
            </p>
            <div>
              <div class="fx-suave">{{ a.qtdRealizada }}/{{ a.qtdAutorizada }} sessões confirmadas</div>
              <div class="fx-progresso">
                <div class="fx-progresso-preenchido" :style="{ width: `${(a.qtdRealizada / a.qtdAutorizada) * 100}%` }"></div>
              </div>
            </div>

            <p v-if="a.aguardandoConfirmacao" class="fx-alerta fx-alerta-ambar">
              <template v-if="a.qtdAutorizada > 1">Sessão {{ a.qtdRealizada + 1 }} registrada.</template>
              <template v-else>Procedimento registrado.</template>
              Aguardando o beneficiário confirmar no app.
            </p>

            <div v-if="a.statusProcedimento !== 'REALIZADA'" class="fx-acoes rodape">
              <button
                v-if="!a.aguardandoConfirmacao"
                type="button"
                class="fx-botao"
                :disabled="processando === a.atendimentoId"
                @click="realizar(a)"
              >
                {{ processando === a.atendimentoId ? 'Enviando...' : a.qtdAutorizada > 1 ? `Realizar sessão ${a.qtdRealizada + 1}` : 'Realizar procedimento' }}
              </button>
              <button
                v-else
                type="button"
                class="fx-botao-secundario fx-botao-perigo"
                :disabled="processando === a.atendimentoId"
                @click="cancelar(a)"
              >
                Cancelar pedido
              </button>
            </div>
          </li>
        </ul>
      </template>
    </div>
  </main>
</template>

<style scoped>
.barra {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.75rem;
}

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

.topo {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.linha {
  margin: 0;
}

.rodape {
  padding-top: 0.75rem;
  border-top: 1px solid var(--fx-borda);
}
</style>
