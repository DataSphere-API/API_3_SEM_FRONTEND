<script setup>
import { ref, nextTick } from 'vue'
import LeitorQr from './components/LeitorQr.vue'
import ConferenciaAtendimento from './components/ConferenciaAtendimento.vue'
import { consultarQr } from '../../services/atendimentoService.js'

const dados = ref(null)
const carregando = ref(false)
const erro = ref('')
const sucessoMsg = ref('')

async function aoQrLido({ codigo, cnpj }) {
  carregando.value = true
  erro.value = ''
  sucessoMsg.value = ''
  dados.value = null

  await nextTick()

  try {
    const resultado = await consultarQr(codigo, cnpj)
    dados.value = resultado
  } catch (e) {
    const cod = e.codigo || ''
    if (cod === 'QR_NAO_ENCONTRADO' || e.status === 404) {
      erro.value = 'QR Code inválido ou não encontrado.'
    } else if (cod === 'QR_JA_UTILIZADO') {
      erro.value = 'Este QR Code já foi utilizado.'
    } else if (cod === 'OCS_DIFERENTE') {
      erro.value = 'OCS diferente da autorizada no contrato.'
    } else if (cod === 'GUIA_VENCIDA') {
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
        @baixa-confirmada="aoBaixaConfirmada"
      />
    </div>
  </main>
</template>