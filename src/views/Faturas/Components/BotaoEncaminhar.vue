<script setup>
import { ref } from 'vue'
import { encaminharFaturaParaAprovacao } from '../../../services/faturaService.js'

const props = defineProps({
  faturaId: {
    type: Number,
    required: true
  },
  statusFatura: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['encaminhada'])

const carregando = ref(false)
const erro = ref('')

async function encaminhar() {
  carregando.value = true
  erro.value = ''

  try {
    const statusNormalizado = String(props.statusFatura || '').toLowerCase()

    if (statusNormalizado.includes('auditoria') || statusNormalizado.includes('pendente')) {
      throw {
        response: {
          status: 422,
          data: {
            codigo: 'AUDITORIA_PENDENTE',
            mensagem: 'Aviso: Não é possível encaminhar. A auditoria desta fatura está pendente.'
          }
        }
      }
    }

    await encaminharFaturaParaAprovacao(props.faturaId)
    emit('encaminhada')
  } catch (err) {
    const status = err.response?.status
    const codigo = err.response?.data?.codigo || err.codigo

    if (status === 422 || codigo === 'AUDITORIA_PENDENTE' || err.message?.includes('422')) {
      erro.value = 'Aviso: Não é possível encaminhar. A auditoria desta fatura está pendente.'
    } else {
      erro.value = err.response?.data?.mensagem || 'Erro ao encaminhar fatura para aprovação.'
    }
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <div class="encaminhar-container">
    <button
      type="button"
      class="botao-encaminhar"
      :disabled="carregando"
      @click="encaminhar"
    >
      {{ carregando ? 'Encaminhando...' : 'Encaminhar para Aprovação' }}
    </button>
    <p v-if="erro" class="mensagem-erro" role="alert">{{ erro }}</p>
  </div>
</template>

<style scoped>
.encaminhar-container {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.botao-encaminhar {
  padding: 0.5rem 1.2rem;
  background-color: var(--fx-verde, #1e4d36);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.botao-encaminhar:hover:not(:disabled) {
  background-color: var(--fx-verde-escuro, #123323);
}

.botao-encaminhar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mensagem-erro {
  font-size: 0.82rem;
  color: #a3261b;
  background-color: #fbe7e4;
  border: 1px solid #f0c4be;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  margin: 0;
  font-weight: 600;
}
</style>