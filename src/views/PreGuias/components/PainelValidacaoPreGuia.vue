<script setup>
import { ref } from 'vue'
import { validarPreGuia } from '../../../services/preGuiaService.js'

const props = defineProps({
  preGuia: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['atualizar'])

const carregando = ref(false)
const erro = ref('')

function deveMostrarValidar() {
  return props.preGuia?.status === 'PRE_GUIA' || props.preGuia?.status === 'COM_PENDENCIAS'
}

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

function baixarJson() {
  const dados = JSON.stringify(props.preGuia, null, 2)
  const blob = new Blob([dados], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pre-guia-${props.preGuia.id}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function baixarPdf() {
  // Simula o download do pacote SIRE em PDF gerando um Blob sem usar alertas em popup
  const conteudoPdf = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/Resources<<>>/MediaBox[0 0 595 842]>>endobj xref\n0 4\n0000000000 65535 f \n000000000; trailer<</Root 1 0 R>>\n%%EOF`
  const blob = new Blob([conteudoPdf], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pacote-sire-${props.preGuia.id}.pdf`
  a.click()
  URL.revokeObjectURL(url)
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
        <button type="button" class="fx-botao-secundario" @click="baixarJson">
          Baixar JSON
        </button>
        <button type="button" class="fx-botao" @click="baixarPdf">
          Baixar PDF (SIRE)
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