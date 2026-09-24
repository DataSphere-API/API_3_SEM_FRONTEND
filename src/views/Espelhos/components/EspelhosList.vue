<template>
  <div class="espelhos-container">
    <div class="filters">
      <button
        v-for="filtro in filtros"
        :key="filtro.valor"
        type="button"
        class="filter-button"
        :class="{ active: filtroSelecionado === filtro.valor }"
        @click="filtroSelecionado = filtro.valor"
      >
        {{ filtro.label }}
      </button>
    </div>

    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>OCS</th>
            <th>Espelho</th>
            <th>Guias</th>
            <th>Data de recebimento</th>
            <th>Status</th>
            <th>Valor</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="espelho in espelhosFiltrados"
            :key="`${espelho.ocs}-${espelho.id}`"
          >
            <td>
              <span class="ocs-name">
                {{ espelho.ocs }}
              </span>
            </td>

            <td>
              <span class="espelho-id">
                #{{ espelho.id }}
              </span>
            </td>

            <td>
              {{ espelho.guias.length }}
            </td>

            <td>
              {{ espelho.data }}
            </td>

            <td>
              <StatusBadge :status="espelho.status" />
            </td>

            <td>
              <span class="value">
                {{ formatarValor(calcularTotal(espelho)) }}
              </span>
            </td>

            <td class="action-cell">
              <button
                type="button"
                class="view-button"
                @click="visualizarEspelho(espelho)"
              >
                Visualizar
              </button>
            </td>
          </tr>

          <tr v-if="espelhosFiltrados.length === 0">
            <td colspan="7">
              <div class="empty-state">
                Nenhum espelho encontrado.
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import StatusBadge from './StatusBadge.vue'

const props = defineProps({
  espelhos: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'visualizar'
])

const filtroSelecionado = ref('todos')

const filtros = [
  {
    label: 'Todos',
    valor: 'todos'
  },
  {
    label: 'Em aberto',
    valor: 'aberto'
  },
  {
    label: 'Faturados',
    valor: 'faturado'
  },
  {
    label: 'Cancelados',
    valor: 'cancelado'
  }
]

const espelhosFiltrados = computed(() => {
  if (filtroSelecionado.value === 'todos') {
    return props.espelhos
  }

  return props.espelhos.filter(
    espelho => espelho.status === filtroSelecionado.value
  )
})

function visualizarEspelho(espelho) {
  emit('visualizar', espelho)
}

function calcularTotal(espelho) {
  return espelho.guias.reduce((total, guia) => {
    return total + (Number(guia.precoCorrigido) || 0)
  }, 0)
}

function formatarValor(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(valor) || 0)
}
</script>

<style scoped>
.espelhos-container {
  width: 100%;
}

.filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.filter-button {
  padding: 0.55rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 9999px;
  background-color: #ffffff;
  color: var(--tertiary-text-color);
  font-family: "Vend Sans", sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
}

.filter-button:hover {
  border-color: var(--color-border-hover);
  color: var(--secondary-text-color);
}

.filter-button.active {
  border-color: var(--primary-color);
  background-color: var(--primary-color);
  color: #ffffff;
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
  padding: 0.85rem 1rem;
  color: var(--secondary-text-color);
  font-size: 0.8rem;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
}

td {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--tertiary-text-color);
  font-size: 0.85rem;
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr {
  transition: background-color 0.2s ease;
}

tbody tr:hover {
  background-color: var(--tertiary-light-bg-color);
}

.ocs-name {
  color: var(--text-color);
  font-weight: 600;
}

.espelho-id {
  color: var(--secondary-text-color);
  font-weight: 600;
}

.value {
  color: var(--text-color);
  font-weight: 600;
  white-space: nowrap;
}

.action-cell {
  text-align: right;
  white-space: nowrap;
}

.view-button {
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--primary-color);
  border-radius: 9999px;
  background-color: var(--primary-light-bg-color);
  color: var(--secondary-text-color);
  font-family: "Vend Sans", sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.view-button:hover {
  border-color: var(--primary-color);
  background-color: var(--secondary-color);
}

.empty-state {
  padding: 2rem;
  color: var(--text-light-color);
  font-size: 0.9rem;
  text-align: center;
}

@media (max-width: 900px) {
  th,
  td {
    padding: 0.75rem;
  }

  th:nth-child(4),
  td:nth-child(4) {
    min-width: 140px;
  }
}

@media (max-width: 768px) {
  .filters {
    gap: 0.4rem;
  }

  .filter-button {
    padding: 0.5rem 0.8rem;
  }
}
</style>