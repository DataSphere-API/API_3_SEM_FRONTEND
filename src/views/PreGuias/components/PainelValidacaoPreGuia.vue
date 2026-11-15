<script setup>
import { ref } from 'vue'
import {
  validarPreGuia,
  obterPacoteSire,
  obterDocumentoConferencia
} from '../../../services/preGuiaService.js'

const props = defineProps({
  preGuia: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['atualizar'])

const carregando = ref(false)
const baixando = ref(false)
const erro = ref('')

function obterStatusNormalizado() {
  const raw = props.preGuia?.status || props.preGuia?.situacao || ''
  return raw.toUpperCase()
}

function deveMostrarValidar() {
  const status = obterStatusNormalizado()
  return ['PRE_GUIA', 'COM_PENDENCIAS', 'RASCUNHO', 'COM PENDÊNCIAS'].includes(status)
}

function devePermitirDownload() {
  const status = obterStatusNormalizado()
  return ['APROVADA', 'EMITIDA'].includes(status)
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

function dispararDownloadBlob(blob, nomeArquivo) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  a.click()
  URL.revokeObjectURL(url)
}

async function baixarJson() {
  baixando.value = true
  erro.value = ''
  try {
    const pacote = await obterPacoteSire(props.preGuia.id)
    const dados = JSON.stringify(pacote, null, 2)
    const blob = new Blob([dados], { type: 'application/json' })
    dispararDownloadBlob(blob, `pacote-sire-${props.preGuia.id}.json`)
  } catch (err) {
    erro.value = err.mensagemUsuario || 'Não foi possível baixar o pacote SIRE (JSON).'
  } finally {
    baixando.value = false
  }
}

async function baixarPdf() {
  baixando.value = true
  erro.value = ''
  try {
    const blob = await obterDocumentoConferencia(props.preGuia.id)
    dispararDownloadBlob(blob, `documento-conferencia-${props.preGuia.id}.pdf`)
  } catch (err) {
    erro.value = err.mensagemUsuario || 'Não foi possível baixar o documento de conferência (PDF).'
  } finally {
    baixando.value = false
  }
}
</script>

<template>
  <div class="fx-cartao painel-validacao">
    <div class="validacao-topo">
      <h3>Validação e Pacote SIRE</h3>
      <span class="fx-selo" :class="'fx-selo-' + (devePermitirDownload() ? 'verde' : 'ambar')">
        {{ preGuia.status || preGuia.situacao }}
      </span>
    </div>

    <div v-if="preGuia.pendencias && preGuia.pendencias.length > 0" class="fx-alerta fx-alerta-vermelho" role="alert">
      <p><strong>Pendências encontradas:</strong></p>
      <ul>
        <li v-for="(pendencia, index) in preGuia.pendencias" :key="index">
          <span v-if="pendencia.codigo" class="fx-mono">[{{ pendencia.codigo }}]</span>
          {{ pendencia.mensagem || pendencia }}
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
        <button type="button" class="fx-botao-secundario" :disabled="baixando" @click="baixarJson">
          {{ baixando ? 'Gerando...' : 'Baixar Pacote SIRE (JSON)' }}
        </button>
        <button type="button" class="fx-botao" :disabled="baixando" @click="baixarPdf">
          {{ baixando ? 'Gerando...' : 'Baixar Documento de Conferência (PDF)' }}
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.painel-validacao {
  margin-top: 1.25rem;
  border-top: 1px solid #e2e8f0;
  padding-top: 1rem;
}
.validacao-topo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}
.validacao-topo h3 {
  margin: 0;
  font-size: 1rem;
}
.acoes-painel {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.75rem;
}
</style>