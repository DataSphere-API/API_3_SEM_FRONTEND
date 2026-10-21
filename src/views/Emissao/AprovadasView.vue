<script setup>
import { ref, computed, onMounted } from 'vue'
import PreGuiaResumo from '../../components/PreGuiaResumo.vue'
import { listarPreGuiasDoFluxo, buscarPreGuiaDoFluxo, emitirGuia } from '../../services/fluxoPreGuiaService.js'
import { formatarMoeda } from '../../utils/avaliarLisura.js'
import { formatarData } from '../../utils/documentos.js'
import { numeroPreGuia, somarDias, VALIDADE_DIAS } from '../../utils/fluxoPreGuia.js'

const preGuias = ref([])
const carregando = ref(false)
const erro = ref('')
const aviso = ref('')
const erroEmissao = ref('')
const emitindo = ref(null)
const aberta = ref(null)

const prontas = computed(() => preGuias.value.filter(p => p.status === 'APROVADA'))
const emitidas = computed(() =>
  preGuias.value.filter(p => p.status === 'EMITIDA').sort((a, b) => (b.dataEmissao || '').localeCompare(a.dataEmissao || ''))
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

async function alternar(id) {
  if (aberta.value?.id === id) {
    aberta.value = null
    return
  }
  try {
    aberta.value = await buscarPreGuiaDoFluxo(id)
  } catch (e) {
    erroEmissao.value = e.mensagemUsuario || 'Não foi possível abrir a pré-guia.'
  }
}

async function emitir(id) {
  aviso.value = ''
  erroEmissao.value = ''
  emitindo.value = id
  try {
    const guia = await emitirGuia(id)
    aviso.value = `Guia ${numeroPreGuia(id)} emitida em ${formatarData(guia.dataEmissao)}, válida até ${formatarData(guia.validoAte)}. Os atendimentos já aparecem para as OCS.`
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
          Aprovadas pelo Médico e pelo Chefe do FUSEx. Emita a guia; ela vale por {{ VALIDADE_DIAS }} dias.
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
            <PreGuiaResumo v-if="aberta?.id === p.id" :pre-guia="aberta" />
            <template v-else>
              <span class="fx-mono"><strong>{{ numeroPreGuia(p.id) }}</strong></span>
              <p class="linha">
                <strong>{{ p.beneficiarioNome }}</strong> · {{ p.qtdProcedimentos }} procedimento(s) · {{ formatarMoeda(p.valorTotal) }}
              </p>
            </template>
            <div class="fx-acoes rodape">
              <button type="button" class="fx-botao" :disabled="emitindo === p.id" @click="emitir(p.id)">
                {{ emitindo === p.id ? 'Emitindo...' : 'Emitir guia' }}
              </button>
              <button type="button" class="fx-botao-secundario" @click="alternar(p.id)">
                {{ aberta?.id === p.id ? 'Recolher' : 'Ver tudo' }}
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
                <td class="fx-mono">{{ numeroPreGuia(p.id) }}</td>
                <td>{{ p.beneficiarioNome }}</td>
                <td>{{ formatarData(p.dataEmissao) }}</td>
                <td>{{ p.dataEmissao ? formatarData(somarDias(p.dataEmissao, VALIDADE_DIAS)) : '—' }}</td>
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
.linha {
  margin: 0;
  line-height: 1.4;
}

.rodape {
  padding-top: 0.75rem;
  border-top: 1px solid var(--fx-borda);
}
</style>
