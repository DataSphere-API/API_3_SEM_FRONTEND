<script setup>
import { ref, computed, onMounted } from 'vue'
import { listarAtendimentosDaOcs, registrarSessao } from '../../services/atendimentoService.js'
import { sessao } from '../../stores/sessao.js'
import { formatarData } from '../../utils/documentos.js'

const FILTROS = [
  { valor: 'ABERTOS', rotulo: 'A realizar' },
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

const ABERTOS = ['PENDENTE', 'EM_ANDAMENTO']

const lista = computed(() => {
  const termo = busca.value.trim().toLowerCase()
  return atendimentos.value
    .filter(a => {
      if (filtro.value === 'ABERTOS') return ABERTOS.includes(a.statusProcedimento)
      if (filtro.value === 'REALIZADA') return a.statusProcedimento === 'REALIZADA' || a.statusProcedimento === 'FATURADA'
      return true
    })
    .filter(a => {
      if (!termo) return true
      const nome = (a.beneficiario?.nome || '').toLowerCase()
      const precCp = a.beneficiario?.precCp || ''
      const procedimento = (a.procedimento || '').toLowerCase()
      return nome.includes(termo) || precCp.includes(termo) || procedimento.includes(termo) || String(a.guiaId).includes(termo)
    })
})

function podeRegistrarSessao(a) {
  return ABERTOS.includes(a.statusProcedimento) && a.qtdRealizada < a.qtdAutorizada
}

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    atendimentos.value = await listarAtendimentosDaOcs(cnpj)
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível carregar os atendimentos.'
  } finally {
    carregando.value = false
  }
}

async function realizarSessao(atendimento) {
  aviso.value = ''
  erroAcao.value = ''
  processando.value = atendimento.atendimentoId
  try {
    const resposta = await registrarSessao(atendimento.atendimentoId)
    aviso.value =
      resposta.saldo > 0
        ? `Sessão ${resposta.numeroSessao} registrada para ${atendimento.beneficiario.nome}. Faltam ${resposta.saldo}.`
        : `Última sessão registrada. Peça ao beneficiário o QR Code para dar a baixa final.`
    await carregar()
  } catch (e) {
    erroAcao.value = e.mensagemUsuario || 'Não foi possível registrar a sessão.'
  } finally {
    processando.value = null
  }
}

function situacao(a) {
  if (a.statusProcedimento === 'FATURADA') return { texto: 'Faturado', classe: 'fx-selo-azul' }
  if (a.statusProcedimento === 'REALIZADA') return { texto: 'Realizado', classe: 'fx-selo-verde' }
  if (a.statusProcedimento === 'EXPIRADA') return { texto: 'Guia vencida', classe: 'fx-selo-vermelho' }
  if (a.qtdRealizada >= a.qtdAutorizada) return { texto: 'Aguardando QR', classe: 'fx-selo-ambar' }
  if (a.qtdRealizada > 0) return { texto: 'Em andamento', classe: 'fx-selo-azul' }
  return { texto: 'A realizar', classe: 'fx-selo-cinza' }
}

onMounted(() => {
  if (cnpj) carregar()
})
</script>

<template>
  <main class="fx-pagina">
    <div class="fx-conteudo fx-conteudo-largo">
      <header class="fx-topo-pagina">
        <div>
          <h1 class="fx-titulo">Atendimentos</h1>
          <p class="fx-subtitulo">
            Registre cada sessão na hora do atendimento. Depois da última, a baixa final é feita com o QR Code do beneficiário.
          </p>
        </div>
        <router-link to="/ocs/atendimento-qr" class="fx-botao link-botao">Baixa final por QR</router-link>
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
            <input v-model="busca" class="fx-entrada" placeholder="Nome, Prec-CP, procedimento ou nº da guia" />
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
              {{ f.rotulo }}
            </button>
          </div>
        </div>

        <p v-if="carregando" class="fx-alerta fx-alerta-cinza">Carregando atendimentos...</p>
        <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>
        <p v-if="!carregando && !erro && lista.length === 0" class="fx-alerta fx-alerta-cinza">
          Nenhum atendimento neste filtro.
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
                · Guia <span class="fx-mono">{{ a.guiaId }}</span>
                · válida até {{ formatarData(a.dataValidade) }}
              </span>
            </p>
            <div>
              <div class="fx-suave">{{ a.qtdRealizada }}/{{ a.qtdAutorizada }} sessões</div>
              <div class="fx-progresso">
                <div class="fx-progresso-preenchido" :style="{ width: `${(a.qtdRealizada / a.qtdAutorizada) * 100}%` }"></div>
              </div>
            </div>

            <div v-if="podeRegistrarSessao(a)" class="fx-acoes rodape">
              <button
                type="button"
                class="fx-botao"
                :disabled="processando === a.atendimentoId"
                @click="realizarSessao(a)"
              >
                {{ processando === a.atendimentoId ? 'Registrando...' : `Registrar sessão ${a.qtdRealizada + 1}` }}
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
  line-height: 1.4;
}

.rodape {
  padding-top: 0.75rem;
  border-top: 1px solid var(--fx-borda);
}

.link-botao {
  text-decoration: none;
}
</style>
