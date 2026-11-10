<script setup>
import { ref } from 'vue'
import {
  validarPreGuia,
  baixarPacoteSire,
  baixarDocumentoConferencia
} from '../../../services/preGuiaService.js'
import { salvarArquivo } from '../../../utils/download.js'

const props = defineProps({
  preGuia: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['atualizar'])

const carregando = ref(false)
const baixando = ref(null) // 'json' | 'pdf' | null
const erro = ref('')

function deveMostrarValidar() {
  return props.preGuia?.status === 'PRE_GUIA' || props.preGuia?.status === 'COM_PENDENCIAS'
}

// Só APROVADA ou EMITIDA libera pacote e PDF (o back também valida).
function devePermitirDownload() {
  return props.preGuia?.status === 'APROVADA' || props.preGuia?.status === 'EMITIDA'
}

async function executarValidacao() {
  carregando.value = true
  erro.value = ''
  try {
    await validarPreGuia(props.preGuia.id)
    emit('atualizar')
  } catch (err) {
    erro.value = err.mensagemUsuario || 'Não foi possível validar a pré-guia.'
  } finally {
    carregando.value = false
  }
}

async function baixar(tipo, buscarArquivo, nomeArquivo) {
  erro.value = ''
  baixando.value = tipo
  try {
    salvarArquivo(await buscarArquivo(props.preGuia.id), nomeArquivo)
  } catch (err) {
    erro.value = err.mensagemUsuario || 'Não foi possível baixar o arquivo.'
  } finally {
    baixando.value = null
  }
}

function baixarJson() {
  return baixar('json', baixarPacoteSire, `pacote-sire-${props.preGuia.id}.json`)
}

function baixarPdf() {
  return baixar('pdf', baixarDocumentoConferencia, `documento-conferencia-${props.preGuia.id}.pdf`)
}
</script>

<template>
  <div class="fx-cartao painel-validacao">
    <div class="validacao-topo">
      <h3>Validação da Pré-Guia</h3>
      <span class="fx-selo" :class="'fx-selo-' + (preGuia.status === 'APROVADA' ? 'verde' : 'ambar')">
        {{ preGuia.status }}
      </span>
    </div>

    <div v-if="preGuia.pendencias && preGuia.pendencias.length > 0" class="fx-alerta fx-alerta-vermelho" role="alert">
      <p><strong>Pendências encontradas:</strong></p>
      <ul>
        <li v-for="(pendencia, index) in preGuia.pendencias" :key="index">
          {{ pendencia.mensagem }}
        </li>
      </ul>
    </div>

    <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>

    <div class="acoes-painel">
      <button
        v-if="deveMostrarValidar()"
        type="button"
        class="fx-botao"
        :disabled="carregando"
        @click="executarValidacao"
      >
        {{ carregando ? 'Validando...' : 'Validar Pré-Guia' }}
      </button>

      <template v-if="devePermitirDownload()">
        <button type="button" class="fx-botao-secundario" :disabled="baixando !== null" @click="baixarJson">
          {{ baixando === 'json' ? 'Baixando...' : 'Baixar pacote SIRE (JSON)' }}
        </button>
        <button type="button" class="fx-botao" :disabled="baixando !== null" @click="baixarPdf">
          {{ baixando === 'pdf' ? 'Baixando...' : 'Baixar PDF de conferência' }}
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.painel-validacao {
  margin-top: 1rem;
}
.validacao-topo {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.acoes-painel {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}
</style>