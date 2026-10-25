<script setup>
import { ref } from 'vue'
import { registrarSessao as svcRegistrarSessao, validarBaixaQr } from '../../../services/atendimentoService.js'

const props = defineProps({
  dados: {
    type: Object,
    required: true
  },
  codigo: {
    type: String,
    default: ''
  },
  cnpj: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['baixa-confirmada'])

const carregando = ref(false)
const erro = ref('')
const sucessoMsg = ref('')

async function registrarSessao() {
  if (carregando.value || !props.dados?.atendimentoId) return

  if ((props.dados.qtdRealizada ?? 0) >= (props.dados.qtdAutorizada ?? 0)) {
    erro.value = 'Todas as sessões autorizadas já foram realizadas.'
    return
  }

  carregando.value = true
  erro.value = ''
  sucessoMsg.value = ''

  try {
    await svcRegistrarSessao(props.dados.atendimentoId, props.cnpj || props.dados.ocs?.cnpj)
    sucessoMsg.value = 'Sessão registrada com sucesso!'

    // Força o incremento fixo e unitário, blindando contra saltos duplos
    const atual = Number(props.dados.qtdRealizada ?? 0)
    const autorizada = Number(props.dados.qtdAutorizada ?? 0)

    if (atual < autorizada) {
      props.dados.qtdRealizada = atual + 1
    }

    props.dados.prontoParaBaixa = props.dados.qtdRealizada >= autorizada
  } catch (err) {
    erro.value = err.mensagemUsuario || 'Não foi possível registrar a sessão.'
  } finally {
    carregando.value = false
  }
}

async function confirmarBaixa() {
  if (carregando.value || !props.dados?.atendimentoId) return
  carregando.value = true
  erro.value = ''
  sucessoMsg.value = ''

  try {
    await validarBaixaQr(props.dados.atendimentoId, props.codigo, props.cnpj || props.dados.ocs?.cnpj)
    emit('baixa-confirmada', props.dados)
  } catch (err) {
    const codigo = err.codigo || ''
    if (codigo === 'QR_NAO_ENCONTRADO' || err.status === 404) {
      erro.value = 'QR Code inválido ou não encontrado.'
    } else if (codigo === 'PROCEDIMENTO_JA_REALIZADO') {
      erro.value = 'Este QR Code já foi utilizado.'
    } else if (codigo === 'OCS_DIFERENTE_DO_CONTRATO') {
      erro.value = 'OCS diferente da autorizada no contrato.'
    } else if (codigo === 'GUIA_EXPIRADA') {
      erro.value = 'Guia vencida. Atendimento não permitido.'
    } else {
      erro.value = err.mensagemUsuario || 'Sessões incompletas para realizar a baixa.'
    }
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <div v-if="dados" class="fx-cartao">
    <h3>Dados do Atendimento</h3>
    <p><strong>Procedimento:</strong> {{ dados.procedimento || 'Não informado' }}</p>
    <p><strong>Beneficiário:</strong> {{ dados.beneficiario?.nome || 'Não informado' }} (PrecCP: {{ dados.beneficiario?.precCp || '-' }})</p>
    <p><strong>OCS:</strong> {{ dados.ocs?.nome || 'Não informada' }}</p>
    <p><strong>Sessões Realizadas / Autorizadas:</strong> {{ dados.qtdRealizada ?? 0 }} / {{ dados.qtdAutorizada ?? 0 }}</p>
    <p><strong>Status:</strong> {{ dados.status || '-' }}</p>

    <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>
    <p v-if="sucessoMsg" class="fx-alerta fx-alerta-verde" role="status">{{ sucessoMsg }}</p>

    <div class="acoes-botoes">
      <button
        type="button"
        class="fx-botao-secundario"
        :disabled="carregando || (dados.qtdRealizada ?? 0) >= (dados.qtdAutorizada ?? 0)"
        @click="registrarSessao"
      >
        Registrar Sessão
      </button>
      <button
        type="button"
        class="fx-botao"
        :disabled="carregando || (dados.qtdRealizada ?? 0) < (dados.qtdAutorizada ?? 0)"
        @click="confirmarBaixa"
      >
        Confirmar Baixa
      </button>
    </div>
  </div>
</template>

<style scoped>
.acoes-botoes {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}
</style>