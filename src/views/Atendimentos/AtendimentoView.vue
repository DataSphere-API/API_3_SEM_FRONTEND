<script setup>
import { ref } from 'vue'
import LeitorQr from './components/LeitorQr.vue'
import ConferenciaAtendimento from './components/ConferenciaAtendimento.vue'
import { consultarQr } from '../../services/atendimentoService.js'

const dados = ref(null)
const codigoLido = ref('')
const carregando = ref(false)
const erro = ref('')
const sucesso = ref('')

async function aoQrLido(codigo) {
  carregando.value = true
  erro.value = ''
  sucesso.value = ''
  dados.value = null
  codigoLido.value = codigo
  try {
    dados.value = await consultarQr(codigo)
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível conferir o QR Code.'
  } finally {
    carregando.value = false
  }
}

function aoBaixaConfirmada(resposta) {
  sucesso.value = `Baixa final registrada para o atendimento ${resposta.atendimentoId}. Ele já pode entrar no espelho.`
  dados.value = null
}
</script>

<template>
  <main class="fx-pagina">
    <div class="fx-conteudo">
      <header>
        <h1 class="fx-titulo">Baixa final por QR Code</h1>
        <p class="fx-subtitulo">Use depois da última sessão. O QR fica disponível para o beneficiário quando todas as sessões foram registradas.</p>
      </header>

      <LeitorQr @qr-lido="aoQrLido" />

      <p v-if="carregando" class="fx-alerta fx-alerta-cinza" role="status">Conferindo...</p>
      <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>
      <p v-if="sucesso" class="fx-alerta fx-alerta-verde" role="status">{{ sucesso }}</p>

      <ConferenciaAtendimento
        v-if="dados"
        :key="dados.atendimentoId"
        :dados="dados"
        :codigo="codigoLido"
        @baixa-confirmada="aoBaixaConfirmada"
      />
    </div>
  </main>
</template>
