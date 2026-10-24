<script setup>
import { ref } from 'vue'
import { api } from '../../../services/http.js'

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

const emit = defineEmits(['regerada'])

const carregando = ref(false)
const erro = ref('')

async function regerar() {
  carregando.value = true
  erro.value = ''

  try {
    const statusNormalizado = String(props.statusFatura || '').toLowerCase()

    if (statusNormalizado.includes('auditoria') || statusNormalizado.includes('pendente')) {
      throw {
        response: {
          status: 422,
          data: {
            mensagem: 'Aviso: Não é possível regerar a fatura enquanto a auditoria estiver pendente.'
          }
        }
      }
    }

    const response = await api.post(`/faturas/${props.faturaId}/regerar`)
    emit('regerada', response.data)
  } catch (err) {
    erro.value = err.response?.data?.mensagem || 'Aviso: Não é possível regerar a fatura enquanto a auditoria estiver pendente.'
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <div class="regerar-container">
    <button
      type="button"
      class="botao-regerar"
      :disabled="carregando"
      @click="regerar"
    >
      {{ carregando ? 'Regerando...' : 'Regerar Fatura' }}
    </button>
    <p v-if="erro" class="mensagem-erro" role="alert">{{ erro }}</p>
  </div>
</template>

<style scoped>
.regerar-container {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.botao-regerar {
  min-height: 44px;
  padding: 0 1.2rem;
  border: 1px solid var(--fx-borda-forte, #c9cfc8);
  border-radius: 8px;
  background-color: #ffffff;
  color: var(--fx-texto, #17201b);
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.botao-regerar:hover:not(:disabled) {
  background-color: var(--fx-verde-claro, #e5eee8);
}

.botao-regerar:disabled {
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