<script setup>
import { ref } from 'vue'
import { validarPreGuia, obterPacoteSire, obterDocumentoConferencia } from '../../../services/fluxoPreGuiaService.js'

const props = defineProps({
  preGuia: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['atualizar'])

const carregandoValidacao = ref(false)
const baixandoJson = ref(false)
const baixandoPdf = ref(false)
const erro = ref('')

const deveMostrarValidar = () => ['PRE_GUIA', 'COM_PENDENCIAS', 'RASCUNHO'].includes(props.preGuia.status)
const devePermitirDownload = () => ['APROVADA', 'EMITIDA'].includes(props.preGuia.status)

async function acionarValidacao() {
  erro.value = ''
  carregandoValidacao.value = true
  try {
    await validarPreGuia(props.preGuia.id)
    emit('atualizar')
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Erro ao validar pré-guia.'
  } finally {
    carregandoValidacao.value = false
  }
}

async function baixarJson() {
  erro.value = ''
  baixandoJson.value = true
  try {
    const dadosServidor = await obterPacoteSire(props.preGuia.id)
    const pacoteFinal = dadosServidor?.preGuia ? dadosServidor : {
      versaoSire: "2.0",
      dataGeracao: new Date().toISOString(),
      preGuia: {
        id: props.preGuia.id,
        numero: props.preGuia.numero || `PG 00${props.preGuia.id}`,
        status: props.preGuia.status,
        beneficiario: props.preGuia.beneficiario || props.preGuia.beneficiarioNome,
        precCp: props.preGuia.beneficiarioPrecCp || props.preGuia.precCp,
        medicoResponsavel: props.preGuia.medico || props.preGuia.medicoResponsavel,
        valorTotal: props.preGuia.valorTotal,
        procedimentos: props.preGuia.procedimentos || props.preGuia.itens || []
      },
      dadosServidor
    }

    const blob = new Blob([JSON.stringify(pacoteFinal, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pacote-sire-${props.preGuia.id}.json`
    link.click()
    window.URL.revokeObjectURL(url)
  } catch (e) {
    erro.value = 'Erro ao baixar pacote SIRE.'
  } finally {
    baixandoJson.value = false
  }
}

async function baixarPdf() {
  erro.value = ''
  baixandoPdf.value = true
  try {
    const resposta = await obterDocumentoConferencia(props.preGuia.id)
    const blobPdf = resposta instanceof Blob ? resposta : new Blob([resposta], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blobPdf)
    const link = document.createElement('a')
    link.href = url
    link.download = `documento-conferencia-${props.preGuia.id}.pdf`
    link.click()
    window.URL.revokeObjectURL(url)
  } catch (e) {
    erro.value = 'Erro ao baixar documento PDF.'
  } finally {
    baixandoPdf.value = false
  }
}
</script>

<template>
  <div class="painel-validacao fx-cartao">
    <h3 class="fx-secao-titulo">Validação e Integração SIRE</h3>

    <p v-if="erro" class="fx-alerta fx-alerta-vermelho">{{ erro }}</p>

    <div v-if="preGuia.validacao?.pendencias?.length" class="fx-alerta fx-alerta-ambar">
      <strong>Pendências encontradas:</strong>
      <ul>
        <li v-for="(p, i) in preGuia.validacao.pendencias" :key="i">{{ p.mensagem }}</li>
      </ul>
    </div>

    <div class="fx-acoes-painel">
      <button
         v-if="deveMostrarValidar()"
         type="button"
         class="fx-botao"
         :disabled="carregandoValidacao"
         @click="acionarValidacao"
      >
        {{ carregandoValidacao ? 'Validando...' : 'Validar Pré-Guia' }}
      </button>

      <template v-if="devePermitirDownload()">
        <button
          type="button"
          class="fx-botao-secundario"
          :disabled="baixandoJson"
          @click="baixarJson"
        >
          {{ baixandoJson ? 'Baixando JSON...' : 'Baixar Pacote SIRE (JSON)' }}
        </button>

        <button
          type="button"
          class="fx-botao-secundario"
          :disabled="baixandoPdf"
          @click="baixarPdf"
        >
          {{ baixandoPdf ? 'Baixando PDF...' : 'Baixar Documento (PDF)' }}
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.painel-validacao {
  margin-top: 1rem;
  background-color: #fafafa;
}
.fx-acoes-painel {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
}
</style>