<script setup>
import { ref, computed, onMounted } from 'vue'
import PreGuiaResumo from '../../components/PreGuiaResumo.vue'
import {
  listarPreGuiasDoFluxo,
  buscarPreGuiaDoFluxo,
  aprovarPreGuia,
  reprovarPreGuia
} from '../../services/fluxoPreGuiaService.js'
import { sessao } from '../../stores/sessao.js'
import { formatarMoeda } from '../../utils/avaliarLisura.js'
import { formatarData, formatarDataHora } from '../../utils/documentos.js'
import { cargoDaAssinatura, numeroPreGuia, seloAprovacao, seloStatus } from '../../utils/fluxoPreGuia.js'

const souMedico = sessao.perfilAtivo === 'MEDICO'
const meuCargo = cargoDaAssinatura(sessao.perfilAtivo)

const aba = ref('pendentes')
const preGuias = ref([])
const carregando = ref(false)
const erro = ref('')
const aviso = ref('')
const selecionada = ref(null)
const carregandoDetalhe = ref(false)
const motivo = ref('')
const reprovando = ref(false)
const erroDecisao = ref('')
const decidindo = ref(false)

const pendentes = computed(() => preGuias.value.filter(p => p.status === 'VALIDADA'))
const lista = computed(() => (aba.value === 'pendentes' ? pendentes.value : preGuias.value))
const podeDecidir = computed(() => selecionada.value?.status === 'VALIDADA')

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    // O médico vê só as pré-guias em que é o responsável; o chefe vê todas.
    const resultado = await listarPreGuiasDoFluxo({ minhas: souMedico })
    preGuias.value = resultado.sort((a, b) => a.dataCriacao.localeCompare(b.dataCriacao))
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível carregar as pré-guias.'
  } finally {
    carregando.value = false
  }
}

async function abrir(id) {
  aviso.value = ''
  erroDecisao.value = ''
  motivo.value = ''
  reprovando.value = false
  carregandoDetalhe.value = true
  try {
    selecionada.value = await buscarPreGuiaDoFluxo(id)
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível abrir a pré-guia.'
  } finally {
    carregandoDetalhe.value = false
  }
}

async function aprovar() {
  erroDecisao.value = ''
  decidindo.value = true
  try {
    const resposta = await aprovarPreGuia(selecionada.value.id)
    aviso.value = `${numeroPreGuia(resposta.preGuiaId)} aprovada e assinada por ${resposta.assinatura.nome} em ${formatarDataHora(resposta.assinatura.dataHora)}. Ela já foi para o emissor.`
    selecionada.value = null
    await carregar()
  } catch (e) {
    erroDecisao.value = e.mensagemUsuario || 'Não foi possível aprovar.'
  } finally {
    decidindo.value = false
  }
}

async function reprovar() {
  erroDecisao.value = ''
  if (!motivo.value.trim()) {
    erroDecisao.value = 'Escreva o motivo da reprovação.'
    return
  }
  decidindo.value = true
  try {
    const resposta = await reprovarPreGuia(selecionada.value.id, motivo.value)
    aviso.value = `${numeroPreGuia(resposta.preGuiaId)} reprovada por ${resposta.assinatura.nome} em ${formatarDataHora(resposta.assinatura.dataHora)}.`
    selecionada.value = null
    await carregar()
  } catch (e) {
    erroDecisao.value = e.mensagemUsuario || 'Não foi possível reprovar.'
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
          Basta a aprovação do médico responsável ou do Chefe do FUSEx. Quem decide assina com nome, data e hora.
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
            Aguardando você<template v-if="!carregando"> ({{ pendentes.length }})</template>
          </button>
          <button
            type="button"
            role="tab"
            class="fx-botao-secundario"
            :class="{ 'aba-ativa': aba === 'todas' }"
            :aria-selected="aba === 'todas'"
            @click="aba = 'todas'"
          >
            Todas
          </button>
        </div>

        <p v-if="carregando || carregandoDetalhe" class="fx-alerta fx-alerta-cinza">Carregando...</p>
        <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>
        <p v-if="!carregando && !erro && lista.length === 0" class="fx-alerta fx-alerta-cinza">
          {{ aba === 'pendentes' ? 'Nenhuma pré-guia aguardando a sua aprovação.' : 'Nenhuma pré-guia.' }}
        </p>

        <ul v-if="!carregando && !erro" class="fx-lista">
          <li v-for="p in lista" :key="p.id" class="fx-cartao">
            <div class="cartao-topo">
              <span class="fx-mono"><strong>{{ numeroPreGuia(p.id) }}</strong></span>
              <span class="fx-selo" :class="seloStatus(p.status).classe">{{ seloStatus(p.status).texto }}</span>
            </div>
            <p class="linha">
              <strong>{{ p.beneficiarioNome }}</strong> · {{ p.qtdProcedimentos }} procedimento(s) · {{ formatarMoeda(p.valorTotal) }}
            </p>
            <div class="cartao-rodape">
              <span class="fx-suave">
                Criada em {{ formatarData(p.dataCriacao) }} ·
                <span class="fx-selo" :class="seloAprovacao(p).classe">{{ seloAprovacao(p).texto }}</span>
              </span>
              <button type="button" class="fx-botao" @click="abrir(p.id)">
                {{ p.status === 'VALIDADA' ? 'Analisar' : 'Ver detalhes' }}
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
          <p class="fx-suave">
            A decisão será assinada por <strong>{{ sessao.usuario.nome }}</strong> ({{ meuCargo }}) com a data e a hora do registro.
          </p>
          <p v-if="erroDecisao" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erroDecisao }}</p>

          <template v-if="reprovando">
            <label class="fx-campo">
              Motivo da reprovação (obrigatório)
              <textarea v-model="motivo" class="fx-entrada fx-texto-longo" placeholder="Ex.: procedimento sem indicação clínica."></textarea>
            </label>
            <div class="fx-acoes">
              <button type="button" class="fx-botao-secundario fx-botao-perigo" :disabled="decidindo" @click="reprovar">
                Confirmar reprovação
              </button>
              <button type="button" class="fx-botao-secundario" @click="reprovando = false">Cancelar</button>
            </div>
          </template>
          <div v-else class="fx-acoes">
            <button type="button" class="fx-botao" :disabled="decidindo" @click="aprovar">Aprovar</button>
            <button type="button" class="fx-botao-secundario fx-botao-perigo" :disabled="decidindo" @click="reprovando = true">
              Reprovar
            </button>
          </div>
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

.linha {
  margin: 0;
  line-height: 1.4;
}
</style>
