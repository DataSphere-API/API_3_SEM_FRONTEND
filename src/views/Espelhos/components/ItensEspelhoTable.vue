<template>
  <div class="guias-container">
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Guia</th>
            <th>Procedimento</th>
            <th>Paciente</th>
            <th>Preço padrão</th>
            <th>Preço corrigido</th>
            <th>Total</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(guia, index) in guias"
            :key="guia.id"
          >
            <td>
              <span class="guia-id">
                #{{ guia.id }}
              </span>
            </td>

            <td>
              <span class="procedure">
                {{ guia.procedimento }}
              </span>
            </td>

            <td>
              {{ guia.paciente }}
            </td>

            <td>
              <span class="standard-price">
                {{ formatarValor(guia.precoPadrao) }}
              </span>
            </td>

            <td>
              <input
                v-if="!somenteLeitura"
                v-model.number="guia.precoCorrigido"
                type="number"
                min="0"
                step="0.01"
              />

              <span
                v-else
                class="corrected-price"
              >
                {{ formatarValor(guia.precoCorrigido) }}
              </span>
            </td>

            <td>
              <span class="total">
                {{ formatarValor(guia.precoCorrigido) }}
              </span>
            </td>

            <td class="action-cell">
              <button
                type="button"
                class="view-button"
                @click="verGuia(guia)"
              >
                Ver guia
              </button>

              <button
                v-if="!somenteLeitura"
                type="button"
                class="remove-button"
                @click="removerGuia(index)"
              >
                Remover
              </button>
            </td>
          </tr>

          <tr v-if="guias.length === 0">
            <td :colspan="somenteLeitura ? 7 : 7">
              <div class="empty-state">
                Nenhuma guia registrada neste espelho.
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="total-container">
      <span>Total do espelho</span>

      <strong>
        {{ formatarValor(totalEspelho) }}
      </strong>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  guias: {
    type: Array,
    default: () => []
  },
  somenteLeitura: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'remover',
  'ver-guia'
])

const totalEspelho = computed(() => {
  return props.guias.reduce((total, guia) => {
    return total + (Number(guia.precoCorrigido) || 0)
  }, 0)
})

function removerGuia(index) {
  emit('remover', index)
}

function verGuia(guia) {
  emit('ver-guia', guia)
}

function formatarValor(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(valor) || 0)
}
</script>

<style scoped>
.guias-container {
  width: 100%;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background-color: var(--primary-light-bg-color);
}

th {
  padding: 0.8rem 0.9rem;
  color: var(--secondary-text-color);
  font-size: 0.78rem;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
}

td {
  padding: 0.85rem 0.9rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--tertiary-text-color);
  font-size: 0.82rem;
}

tbody tr:last-child td {
  border-bottom: none;
}

.guia-id {
  color: var(--text-color);
  font-weight: 600;
  white-space: nowrap;
}

.procedure {
  color: var(--text-color);
  font-weight: 500;
}

.standard-price {
  color: var(--text-light-color);
  white-space: nowrap;
}

.corrected-price {
  color: var(--secondary-text-color);
  font-weight: 600;
  white-space: nowrap;
}

input {
  width: 110px;
  box-sizing: border-box;
  padding: 0.55rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: #ffffff;
  color: var(--text-color);
  font-family: "DM Sans", sans-serif;
  font-size: 0.8rem;
  outline: none;
}

input:focus {
  border-color: var(--primary-color);
  box-shadow:
    0 0 0 3px rgba(var(--primary-color-decimal), 0.1);
}

.total {
  color: var(--text-color);
  font-weight: 600;
  white-space: nowrap;
}

.action-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  white-space: nowrap;
}

.view-button,
.remove-button {
  padding: 0.45rem 0.75rem;
  border-radius: 9999px;
  font-family: "Vend Sans", sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
}

.view-button {
  border: 1px solid var(--primary-color);
  background-color: var(--primary-light-bg-color);
  color: var(--secondary-text-color);
}

.view-button:hover {
  background-color: var(--secondary-color);
}

.remove-button {
  border: 1px solid var(--color-border);
  background-color: #ffffff;
  color: var(--tertiary-text-color);
}

.remove-button:hover {
  border-color: var(--color-border-hover);
  background-color: var(--color-background-mute);
}

.empty-state {
  padding: 1.5rem;
  color: var(--text-light-color);
  text-align: center;
}

.total-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
}

.total-container span {
  color: var(--tertiary-text-color);
  font-size: 0.85rem;
}

.total-container strong {
  color: var(--text-color);
  font-size: 1.1rem;
}

@media (max-width: 900px) {
  .action-cell {
    flex-direction: column;
    align-items: flex-end;
  }
}

@media (max-width: 768px) {
  th,
  td {
    padding: 0.6rem;
  }

  input {
    width: 100px;
  }

  .total-container {
    justify-content: space-between;
  }
}
</style>