<script setup>
import { ref, nextTick } from 'vue'
import LeitorQr from './components/LeitorQr.vue'
import ConferenciaAtendimento from './components/ConferenciaAtendimento.vue'
import { consultarQr } from '../../services/atendimentoService.js'

const dados = ref(null)
const codigoLido = ref('')
const cnpjLido = ref('')
const carregando = ref(false)
const erro = ref('')
const sucessoMsg = ref('')

async function aoQrLido({ codigo, cnpj }) {
  carregando.value = true
  erro.value = ''
  sucessoMsg.value = ''
  dados.value = null
  codigoLido.value = codigo
  cnpjLido.value = cnpj

  await nextTick()

  try {
    const resultado = await consultarQr(codigo, cnpj)
    dados.value = resultado
  } catch (e) {
    const cod = e.codigo || ''
    if (cod === 'QR_NAO_ENCONTRADO' || e.status === 404) {
      erro.value = 'QR Code inválido ou não encontrado.'
    } else if (cod === 'PROCEDIMENTO_JA_REALIZADO') {
      erro.value = 'Este QR Code já foi utilizado.'
    } else if (cod === 'OCS_DIFERENTE_DO_CONTRATO') {
      erro.value = 'OCS diferente da autorizada no contrato.'
    } else if (cod === 'GUIA_EXPIRADA') {
      erro.value = 'Guia vencida. Atendimento não permitido.'
    } else {
      erro.value = e.mensagemUsuario || 'Ocorreu um erro na validação.'
    }
  } finally {
    carregando.value = false
  }
}

function aoBaixaConfirmada(detalhes) {
  sucessoMsg.value = 'Baixa confirmada com sucesso para o atendimento ID: ' + (detalhes?.atendimentoId || '')
  dados.value = null
}
</script>

<template>
  <main class="fx-pagina">
    <div class="fx-conteudo">
      <header>
        <h1 class="fx-titulo">Validação e Baixa de Atendimento</h1>
        <p class="fx-subtitulo">Consulte o QR Code para conferir sessões e confirmar baixa.</p>
      </header>

      <LeitorQr @qr-lido="aoQrLido" />

      <p v-if="carregando" class="fx-alerta fx-alerta-cinza" role="status">Processando solicitação...</p>
      <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>
      <p v-if="sucessoMsg" class="fx-alerta fx-alerta-verde" role="status">{{ sucessoMsg }}</p>

      <ConferenciaAtendimento
        v-if="dados"
        :key="dados.atendimentoId"
        :dados="dados"
        :codigo="codigoLido"
        :cnpj="cnpjLido"
        @baixa-confirmada="aoBaixaConfirmada"
      />
    </div>
  </main>
</template>