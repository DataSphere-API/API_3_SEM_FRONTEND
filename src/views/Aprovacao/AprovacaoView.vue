<script setup>
import { ref, computed, onMounted } from 'vue'
import PreGuiaResumo from '../../components/PreGuiaResumo.vue'
import { listarPreGuiasDoFluxo, decidirPreGuia } from '../../services/fluxoPreGuiaService.js'
import { sessao } from '../../stores/sessao.js'
import { formatarMoeda } from '../../utils/avaliarLisura.js'
import { formatarData } from '../../utils/documentos.js'
import { CARATER, seloDecisao, seloStatus } from '../../utils/fluxoPreGuia.js'

const meuCampo = sessao.perfilAtivo === 'MEDICO' ? 'aprovacaoMedico' : 'aprovacaoChefe'
const outroCampo = meuCampo === 'aprovacaoMedico' ? 'aprovacaoChefe' : 'aprovacaoMedico'
const outroRotulo = meuCampo === 'aprovacaoMedico' ? 'Chefe do FUSEx' : 'Médico'

const aba = ref('pendentes')
const preGuias = ref([])
const carregando = ref(false)
const erro = ref('')
const aviso = ref('')
const selecionada = ref(null)
const observacao = ref('')
const erroDecisao = ref('')
const decidindo = ref(false)

const lista = computed(() => {
  if (aba.value === 'pendentes') {
    return preGuias.value.filter(p => p.status === 'AGUARDANDO_APROVACAO' && p[meuCampo].decisao === 'PENDENTE')
  }
  return preGuias.value.filter(p => p[meuCampo].decisao !== 'PENDENTE')
})

const totalPendentes = computed(
  () => preGuias.value.filter(p => p.status === 'AGUARDANDO_APROVACAO' && p[meuCampo].decisao === 'PENDENTE').length
)

const podeDecidir = computed(
  () => selecionada.value?.status === 'AGUARDANDO_APROVACAO' && selecionada.value[meuCampo].decisao === 'PENDENTE'
)

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    // Urgentes primeiro, depois as mais antigas.
    preGuias.value = (await listarPreGuiasDoFluxo()).sort(
      (a, b) => (a.carater === 'URGENCIA' ? 0 : 1) - (b.carater === 'URGENCIA' ? 0 : 1) || a.criadaEm.localeCompare(b.criadaEm)
    )
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível carregar as pré-guias.'
  } finally {
    carregando.value = false
  }
}

function abrir(preGuia) {
  aviso.value = ''
  erroDecisao.value = ''
  observacao.value = ''
  selecionada.value = preGuia
}

async function decidir(acao) {
  erroDecisao.value = ''
  if (acao !== 'aprovar' && !observacao.value.trim()) {
    erroDecisao.value = 'Escreva a observação para devolver ou negar.'
    return
  }
  decidindo.value = true
  try {
    const atualizada = await decidirPreGuia(selecionada.value.id, acao, observacao.value)
    const textos = {
      aprovar:
        atualizada.status === 'APROVADA'
          ? 'aprovada. Com as duas aprovações, ela já foi para o emissor.'
          : `aprovada. Falta a decisão do ${outroRotulo}.`,
      devolver: 'devolvida ao emissor para correção.',
      reprovar: 'negada.'
    }
    aviso.value = `Pré-guia ${atualizada.numero} ${textos[acao]}`
    selecionada.value = null
    await carregar()
  } catch (e) {
    erroDecisao.value = e.mensagemUsuario || 'Não foi possível registrar a decisão.'
  } finally {
    decidindo.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <main class="fx-pagina">
    <div class="fx-conteudo fx-conteudo-largo">
      <header>
        <h1 class="fx-titulo">Pré-guias para aprovar</h1>
        <p class="fx-subtitulo">
          Médico e Chefe do FUSEx aprovam em paralelo. A guia só vai para o emissor quando os dois aprovam.
        </p>
      </header>

      <p v-if="aviso" class="fx-alerta fx-alerta-verde" role="status">{{ aviso }}</p>

      <template v-if="!selecionada">
        <div class="abas" role="tablist">
          <button
            type="button"
            role="tab"
            class="fx-botao-secundario"
            :class="{ 'aba-ativa': aba === 'pendentes' }"
            :aria-selected="aba === 'pendentes'"
            @click="aba = 'pendentes'"
          >
            Aguardando você<template v-if="!carregando"> ({{ totalPendentes }})</template>
          </button>
          <button
            type="button"
            role="tab"
            class="fx-botao-secundario"
            :class="{ 'aba-ativa': aba === 'decididas' }"
            :aria-selected="aba === 'decididas'"
            @click="aba = 'decididas'"
          >
            Já decididas por mim
          </button>
        </div>

        <p v-if="carregando" class="fx-alerta fx-alerta-cinza">Carregando pré-guias...</p>
        <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>
        <p v-if="!carregando && !erro && lista.length === 0" class="fx-alerta fx-alerta-cinza">
          {{ aba === 'pendentes' ? 'Nenhuma pré-guia aguardando a sua decisão.' : 'Você ainda não decidiu nenhuma pré-guia.' }}
        </p>

        <ul v-if="!carregando && !erro" class="fx-lista">
          <li v-for="p in lista" :key="p.id" class="fx-cartao">
            <div class="cartao-topo">
              <span class="fx-mono"><strong>{{ p.numero }}</strong></span>
              <span class="selos">
                <span v-if="p.carater === 'URGENCIA'" class="fx-selo fx-selo-vermelho">{{ CARATER.URGENCIA }}</span>
                <span class="fx-selo" :class="seloStatus(p.status).classe">{{ seloStatus(p.status).texto }}</span>
              </span>
            </div>
            <p class="linha">
              <strong>{{ p.beneficiario.nome }}</strong> ·
              {{ p.procedimentos.map(x => x.nome).join(', ') }}
            </p>
            <div class="cartao-rodape">
              <span class="fx-suave">
                {{ formatarData(p.criadaEm) }} · {{ formatarMoeda(p.valorTotal) }} ·
                {{ outroRotulo }}:
                <span class="fx-selo" :class="seloDecisao(p[outroCampo].decisao).classe">
                  {{ seloDecisao(p[outroCampo].decisao).texto }}
                </span>
              </span>
              <button type="button" class="fx-botao" @click="abrir(p)">
                {{ aba === 'pendentes' ? 'Analisar' : 'Ver detalhes' }}
              </button>
            </div>
          </li>
        </ul>
      </template>

      <template v-else>
        <div>
          <button type="button" class="fx-botao-secundario" @click="selecionada = null">← Voltar para a lista</button>
        </div>

        <article class="fx-cartao">
          <PreGuiaResumo :pre-guia="selecionada" />
        </article>

        <section v-if="podeDecidir" class="fx-cartao">
          <h2 class="fx-secao-titulo">Sua decisão</h2>
          <p v-if="erroDecisao" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erroDecisao }}</p>
          <label class="fx-campo">
            Observação (obrigatória para devolver ou negar)
            <textarea
              v-model="observacao"
              class="fx-entrada fx-texto-longo"
              placeholder="Ex.: falta o CID e o laudo do exame anterior."
            ></textarea>
          </label>
          <div class="fx-acoes">
            <button type="button" class="fx-botao" :disabled="decidindo" @click="decidir('aprovar')">Aprovar</button>
            <button type="button" class="fx-botao-secundario" :disabled="decidindo" @click="decidir('devolver')">
              Devolver ao emissor
            </button>
            <button type="button" class="fx-botao-secundario fx-botao-perigo" :disabled="decidindo" @click="decidir('reprovar')">
              Negar
            </button>
          </div>
          <p class="fx-suave">
            Devolver manda a pré-guia de volta para o emissor corrigir. Negar encerra a solicitação.
          </p>
        </section>
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

.cartao-topo,
.cartao-rodape {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.cartao-rodape {
  padding-top: 0.75rem;
  border-top: 1px solid var(--fx-borda);
}

.selos {
  display: flex;
  gap: 0.35rem;
}

.linha {
  margin: 0;
  line-height: 1.4;
}
</style>
