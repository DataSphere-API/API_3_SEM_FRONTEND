<script setup>
import { ref, computed, onMounted } from 'vue'
import PreGuiaResumo from '../../components/PreGuiaResumo.vue'
import { listarPreGuiasDoFluxo, emitirGuia } from '../../services/fluxoPreGuiaService.js'
import { formatarMoeda } from '../../utils/avaliarLisura.js'
import { formatarData } from '../../utils/documentos.js'
import { CARATER } from '../../utils/fluxoPreGuia.js'

const preGuias = ref([])
const carregando = ref(false)
const erro = ref('')
const aviso = ref('')
const erroEmissao = ref('')
const emitindo = ref(null)
const aberta = ref(null)

const prontas = computed(() =>
  preGuias.value
    .filter(p => p.status === 'APROVADA')
    .sort((a, b) => (a.carater === 'URGENCIA' ? 0 : 1) - (b.carater === 'URGENCIA' ? 0 : 1))
)
const emitidas = computed(() =>
  preGuias.value.filter(p => p.status === 'EMITIDA').sort((a, b) => b.dataEmissao.localeCompare(a.dataEmissao))
)

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    preGuias.value = await listarPreGuiasDoFluxo()
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível carregar as pré-guias aprovadas.'
  } finally {
    carregando.value = false
  }
}

async function emitir(preGuia) {
  aviso.value = ''
  erroEmissao.value = ''
  emitindo.value = preGuia.id
  try {
    const guia = await emitirGuia(preGuia.id)
    aviso.value = `Guia ${preGuia.numero} emitida em ${formatarData(guia.dataEmissao)}, válida até ${formatarData(guia.validoAte)}. O beneficiário já vê a guia no app.`
    aberta.value = null
    await carregar()
  } catch (e) {
    erroEmissao.value = e.mensagemUsuario || 'Não foi possível emitir a guia.'
  } finally {
    emitindo.value = null
  }
}

onMounted(carregar)
</script>

<template>
  <main class="fx-pagina">
    <div class="fx-conteudo fx-conteudo-largo">
      <header>
        <h1 class="fx-titulo">Pré-guias aprovadas</h1>
        <p class="fx-subtitulo">
          Aprovadas pelo Médico e pelo Chefe do FUSEx. Emita a guia de encaminhamento; ela vale por 60 dias.
        </p>
      </header>

      <p v-if="aviso" class="fx-alerta fx-alerta-verde" role="status">{{ aviso }}</p>
      <p v-if="erroEmissao" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erroEmissao }}</p>
      <p v-if="carregando" class="fx-alerta fx-alerta-cinza">Carregando...</p>
      <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>

      <template v-if="!carregando && !erro">
        <h2 class="fx-secao-titulo">Prontas para emitir · {{ prontas.length }}</h2>
        <p v-if="prontas.length === 0" class="fx-alerta fx-alerta-cinza">Nenhuma pré-guia aguardando emissão.</p>

        <ul class="fx-lista">
          <li v-for="p in prontas" :key="p.id" class="fx-cartao">
            <template v-if="aberta === p.id">
              <PreGuiaResumo :pre-guia="p" />
            </template>
            <template v-else>
              <div class="topo">
                <span class="fx-mono"><strong>{{ p.numero }}</strong></span>
                <span v-if="p.carater === 'URGENCIA'" class="fx-selo fx-selo-vermelho">{{ CARATER.URGENCIA }}</span>
              </div>
              <p class="linha">
                <strong>{{ p.beneficiario.nome }}</strong> · {{ p.procedimentos.map(x => `${x.nome} (${x.ocs.nome})`).join(', ') }}
              </p>
              <p class="fx-suave linha">
                Médico: {{ p.aprovacaoMedico.por }} · Chefe: {{ p.aprovacaoChefe.por }} · {{ formatarMoeda(p.valorTotal) }}
              </p>
            </template>
            <div class="fx-acoes rodape">
              <button type="button" class="fx-botao" :disabled="emitindo === p.id" @click="emitir(p)">
                {{ emitindo === p.id ? 'Emitindo...' : 'Emitir guia' }}
              </button>
              <button type="button" class="fx-botao-secundario" @click="aberta = aberta === p.id ? null : p.id">
                {{ aberta === p.id ? 'Recolher' : 'Ver tudo' }}
              </button>
            </div>
          </li>
        </ul>

        <h2 class="fx-secao-titulo">Emitidas</h2>
        <div class="fx-tabela-rolagem">
          <table class="fx-tabela">
            <thead>
              <tr>
                <th>Guia</th>
                <th>Beneficiário</th>
                <th>Emissão</th>
                <th>Validade</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in emitidas" :key="p.id">
                <td class="fx-mono">{{ p.numero }}</td>
                <td>{{ p.beneficiario.nome }}</td>
                <td>{{ formatarData(p.dataEmissao) }}</td>
                <td>{{ formatarData(p.validoAte) }}</td>
                <td class="fx-mono">{{ formatarMoeda(p.valorTotal) }}</td>
              </tr>
              <tr v-if="emitidas.length === 0">
                <td colspan="5" class="fx-suave">Nenhuma guia emitida ainda.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </main>
</template>

<style scoped>
.topo {
  display: flex;
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
</style>
