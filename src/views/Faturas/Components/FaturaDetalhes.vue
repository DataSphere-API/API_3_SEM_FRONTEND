<template>
  <div v-if="aberto" class="modal-overlay" @click.self="fechar">
    <div class="modal">
      <header class="modal-header">
        <div>
          <h2>Fatura #{{ fatura?.id }}</h2>
          <p>{{ fatura?.ocs }}</p>
        </div>

        <button type="button" class="close-button" @click="fechar">
          ×
        </button>
      </header>

      <div class="modal-body">
        <section class="info-section">
          <div class="info-item">
            <span class="info-label">OCS</span>
            <span class="info-value">{{ fatura?.ocs }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">Fatura</span>
            <span class="info-value">#{{ fatura?.id }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">Espelho</span>
            <span class="info-value">#{{ fatura?.espelhoId }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">Data de geração</span>
            <span class="info-value">{{ fatura?.data }}</span>
          </div>

          <div class="info-item">
            <span class="info-label">Status</span>
            <StatusBadge :status="fatura?.status" />
          </div>
        </section>

        <section class="items-section">
          <div class="section-title">
            <div>
              <h3>Itens da fatura</h3>
              <p>Valores apresentados e contratados por guia.</p>
            </div>
          </div>

          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Guia</th>
                  <th>Procedimento</th>
                  <th>Paciente</th>
                  <th>Valor apresentado</th>
                  <th>Valor contratado</th>
                  <th>Divergência</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="item in fatura?.itens || []"
                  :key="item.guiaId"
                >
                  <td>
                    <span class="guide-id">#{{ item.guiaId }}</span>
                  </td>

                  <td>{{ item.procedimento }}</td>

                  <td>{{ item.paciente }}</td>

                  <td>
                    <span class="money">
                      {{ formatarValor(item.valorApresentado) }}
                    </span>
                  </td>

                  <td>
                    <span class="money">
                      {{ formatarValor(item.valorContratado) }}
                    </span>
                  </td>

                  <td>
                    <span
                      class="divergencia"
                      :class="{
                        positiva: calcularDivergencia(item) > 0,
                        negativa: calcularDivergencia(item) < 0,
                        zerada: calcularDivergencia(item) === 0
                      }"
                    >
                      {{ formatarDivergencia(calcularDivergencia(item)) }}
                    </span>
                  </td>

                  <td class="action-cell">
                    <button
                      type="button"
                      class="guide-button"
                      @click="verGuia(item)"
                    >
                      Ver guia
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="totals-section">
          <div class="total-card">
            <span class="total-label">Total apresentado</span>
            <strong>{{ formatarValor(totalApresentado) }}</strong>
          </div>

          <div class="total-card">
            <span class="total-label">Total contratado</span>
            <strong>{{ formatarValor(totalContratado) }}</strong>
          </div>

          <div class="total-card">
            <span class="total-label">Divergência total</span>
            <strong
              class="total-divergencia"
              :class="{
                positiva: divergenciaTotal > 0,
                negativa: divergenciaTotal < 0,
                zerada: divergenciaTotal === 0
              }"
            >
              {{ formatarDivergencia(divergenciaTotal) }}
            </strong>
          </div>
        </section>
      </div>

      <footer class="modal-footer">
        <button
          type="button"
          class="back-button"
          @click="fechar"
        >
          Voltar
        </button>

        <button
          v-if="fatura?.podeRegerar"
          type="button"
          class="regenerate-button"
          @click="regerar"
        >
          Regerar fatura
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import StatusBadge from './StatusBadge.vue'

const props = defineProps({
  aberto: {
    type: Boolean,
    default: false
  },
  fatura: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['fechar', 'regerar'])

const totalApresentado = computed(() => {
  if (!props.fatura?.itens) return 0

  return props.fatura.itens.reduce((total, item) => {
    return total + (Number(item.valorApresentado) || 0)
  }, 0)
})

const totalContratado = computed(() => {
  if (!props.fatura?.itens) return 0

  return props.fatura.itens.reduce((total, item) => {
    return total + (Number(item.valorContratado) || 0)
  }, 0)
})

const divergenciaTotal = computed(() => {
  return totalApresentado.value - totalContratado.value
})

function calcularDivergencia(item) {
  return (
    (Number(item.valorApresentado) || 0) -
    (Number(item.valorContratado) || 0)
  )
}

function formatarValor(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(valor) || 0)
}

function formatarDivergencia(valor) {
  const numero = Number(valor) || 0

  if (numero > 0) {
    return `+${formatarValor(numero)}`
  }

  return formatarValor(numero)
}

function verGuia(item) {
  console.log('Abrir guia:', item.guiaId)
}

function regerar() {
  emit('regerar', props.fatura)
}

function fechar() {
  emit('fechar')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background-color: rgba(24, 59, 50, 0.35);
}

.modal {
  width: min(1100px, 100%);
  max-height: calc(100vh - 3rem);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #ffffff;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(24, 59, 50, 0.18);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  margin: 0;
  color: var(--text-color);
  font-family: "DM Sans", sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
}

.modal-header p {
  margin: 0.3rem 0 0;
  color: var(--text-light-color);
  font-size: 0.85rem;
}

.close-button {
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  border-radius: 50%;
  background-color: var(--primary-light-bg-color);
  color: var(--secondary-text-color);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
}

.modal-body {
  overflow-y: auto;
  padding: 1.5rem;
}

.info-section {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.info-label {
  color: var(--text-light-color);
  font-size: 0.75rem;
  font-weight: 500;
}

.info-value {
  color: var(--text-color);
  font-size: 0.9rem;
  font-weight: 600;
}

.items-section {
  margin-bottom: 1.5rem;
}

.section-title {
  margin-bottom: 1rem;
}

.section-title h3 {
  margin: 0;
  color: var(--text-color);
  font-size: 1rem;
  font-weight: 600;
}

.section-title p {
  margin: 0.3rem 0 0;
  color: var(--text-light-color);
  font-size: 0.8rem;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: 12px;
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
  font-size: 0.75rem;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
}

td {
  padding: 0.85rem 0.9rem;
  border-top: 1px solid var(--color-border);
  color: var(--tertiary-text-color);
  font-size: 0.8rem;
}

.guide-id {
  color: var(--secondary-text-color);
  font-weight: 600;
}

.money {
  color: var(--text-color);
  font-weight: 600;
  white-space: nowrap;
}

.divergencia {
  font-weight: 600;
  white-space: nowrap;
}

.divergencia.positiva,
.total-divergencia.positiva {
  color: #C05A5A;
}

.divergencia.negativa,
.total-divergencia.negativa {
  color: var(--secondary-text-color);
}

.divergencia.zerada,
.total-divergencia.zerada {
  color: var(--text-light-color);
}

.action-cell {
  text-align: right;
  white-space: nowrap;
}

.guide-button {
  padding: 0.45rem 0.8rem;
  border: 1px solid var(--primary-color);
  border-radius: 9999px;
  background-color: var(--primary-light-bg-color);
  color: var(--secondary-text-color);
  font-family: "Vend Sans", sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
}

.guide-button:hover {
  background-color: var(--secondary-color);
}

.totals-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.total-card {
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background-color: var(--tertiary-light-bg-color);
}

.total-label {
  display: block;
  margin-bottom: 0.35rem;
  color: var(--text-light-color);
  font-size: 0.75rem;
}

.total-card strong {
  color: var(--text-color);
  font-size: 1rem;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--color-border);
}

.back-button,
.regenerate-button {
  padding: 0.65rem 1rem;
  border-radius: 9999px;
  font-family: "Vend Sans", sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
}

.back-button {
  border: 1px solid var(--color-border);
  background-color: #ffffff;
  color: var(--tertiary-text-color);
}

.regenerate-button {
  border: 1px solid var(--primary-color);
  background-color: var(--primary-color);
  color: #ffffff;
}

.regenerate-button:hover {
  background-color: var(--primary-dark-bg-color);
}

@media (max-width: 900px) {
  .info-section {
    grid-template-columns: repeat(2, 1fr);
  }

  .totals-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .modal-overlay {
    padding: 0.75rem;
  }

  .modal {
    max-height: calc(100vh - 1.5rem);
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }

  .info-section {
    grid-template-columns: 1fr;
  }

  .modal-footer {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}
</style>