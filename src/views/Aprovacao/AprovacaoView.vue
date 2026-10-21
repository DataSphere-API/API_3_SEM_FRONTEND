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
import { formatarData } from '../../utils/documentos.js'
import { numeroPreGuia, seloAprovacao, seloStatus } from '../../utils/fluxoPreGuia.js'

const souMedico = sessao.perfilAtivo === 'MEDICO'
const meuCampo = souMedico ? 'medicoAprovou' : 'chefeAprovou'
const outroCampo = souMedico ? 'chefeAprovou' : 'medicoAprovou'
const outroRotulo = souMedico ? 'Chefe do FUSEx' : 'Médico'

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

const pendentes = computed(() => preGuias.value.filter(p => p.status === 'VALIDADA' && !p[meuCampo]))
const lista = computed(() => (aba.value === 'pendentes' ? pendentes.value : preGuias.value))

const minhaAprovacaoPendente = computed(() => {
  const p = selecionada.value
  if (!p || p.status !== 'VALIDADA') return false
  return souMedico ? !p.dataAprovacaoMedico : !p.dataAprovacaoChefe
})

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    preGuias.value = (await listarPreGuiasDoFluxo()).sort((a, b) => a.dataCriacao.localeCompare(b.dataCriacao))
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
    aviso.value =
      resposta.status === 'APROVADA'
        ? `${numeroPreGuia(resposta.preGuiaId)} aprovada. Com as duas aprovações, ela já foi para o emissor.`
        : `${numeroPreGuia(resposta.preGuiaId)} aprovada. Falta a aprovação do ${outroRotulo}.`
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
    aviso.value = `${numeroPreGuia(resposta.preGuiaId)} reprovada.`
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
                Criada em {{ formatarData(p.dataCriacao) }} · {{ outroRotulo }}:
                <span class="fx-selo" :class="seloAprovacao(p.status, p[outroCampo]).classe">
                  {{ seloAprovacao(p.status, p[outroCampo]).texto }}
                </span>
              </span>
              <button type="button" class="fx-botao" @click="abrir(p.id)">
                {{ p.status === 'VALIDADA' && !p[meuCampo] ? 'Analisar' : 'Ver detalhes' }}
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

        <section v-if="minhaAprovacaoPendente" class="fx-cartao">
          <h2 class="fx-secao-titulo">Sua decisão</h2>
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
