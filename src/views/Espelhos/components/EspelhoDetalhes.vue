<template>
  <div
    v-if="aberto"
    class="modal-overlay"
    @click.self="fechar"
  >
    <div class="modal">
      <header class="modal-header">
        <div>
          <h2>
            Espelho #{{ espelho?.id }} — {{ espelho?.ocs }}
          </h2>

          <p>
            Guias recebidas da OCS neste espelho.
          </p>
        </div>

        <button
          type="button"
          class="close-button"
          @click="fechar"
        >
          ×
        </button>
      </header>

      <div class="modal-body">
        <section class="info-section">
          <h3>Informações do espelho</h3>

          <div class="info-grid">
            <div class="info-item">
              <span>OCS</span>
              <strong>{{ espelho?.ocs }}</strong>
            </div>

            <div class="info-item">
              <span>Espelho</span>
              <strong>#{{ espelho?.id }}</strong>
            </div>

            <div class="info-item">
              <span>Quantidade de guias</span>
              <strong>{{ guias.length }}</strong>
            </div>

            <div class="info-item">
              <span>Recebimento</span>
              <strong>{{ espelho?.data }}</strong>
            </div>

            <div class="info-item">
              <span>Status</span>
              <StatusBadge :status="espelho?.status" />
            </div>
          </div>
        </section>

        <section class="items-section">
          <div class="section-title">
            <div>
              <h3>Guias do espelho</h3>

              <p>
                Consulte os procedimentos realizados e os valores de cada guia.
              </p>
            </div>
          </div>

          <ItensEspelhoTable
            :guias="guias"
            :somente-leitura="!podeEditar"
            @remover="removerGuia"
            @ver-guia="verGuia"
          />
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
          v-if="podeEditar"
          type="button"
          class="save-button"
          @click="salvar"
        >
          Salvar alterações
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import StatusBadge from './StatusBadge.vue'
import ItensEspelhoTable from './ItensEspelhoTable.vue'

const props = defineProps({
  aberto: {
    type: Boolean,
    default: false
  },
  espelho: {
    type: Object,
    default: null
  }
})

const emit = defineEmits([
  'fechar',
  'salvar'
])

const guias = ref([])

const podeEditar = computed(() => {
  return props.espelho?.status === 'aberto'
})

watch(
  () => props.espelho,
  novoEspelho => {
    if (!novoEspelho) {
      guias.value = []
      return
    }

    guias.value = (novoEspelho.guias || []).map(guia => ({
      ...guia,
      precoCorrigido: guia.precoCorrigido ?? guia.precoPadrao
    }))
  },
  {
    immediate: true
  }
)

function removerGuia(index) {
  guias.value.splice(index, 1)
}

function verGuia(guia) {
  console.log('Abrir guia:', guia.id)
}

function salvar() {
  emit('salvar', {
    ...props.espelho,
    guias: guias.value
  })
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

  padding: 2rem;

  background-color: rgba(24, 59, 50, 0.35);

  overflow-y: auto;
}

.modal {
  width: min(1080px, 92vw);
  max-height: 88vh;

  display: flex;
  flex-direction: column;

  overflow: hidden;

  background-color: #ffffff;

  border-radius: 18px;

  box-shadow:
    0 20px 60px rgba(var(--text-color-decimal), 0.2);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  gap: 1rem;

  padding: 1.5rem;

  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  margin: 0;

  color: var(--text-color);

  font-size: 1.2rem;
  font-weight: 700;
}

.modal-header p {
  margin: 0.35rem 0 0;

  color: var(--text-light-color);

  font-size: 0.82rem;
}

.close-button {
  flex-shrink: 0;

  width: 34px;
  height: 34px;

  border: none;
  border-radius: 50%;

  background-color: var(--color-background-mute);

  color: var(--tertiary-text-color);

  font-size: 1.4rem;

  cursor: pointer;
}

.close-button:hover {
  background-color: var(--primary-light-bg-color);

  color: var(--text-color);
}

.modal-body {
  flex: 1;

  min-height: 0;

  overflow-y: auto;

  padding: 1.5rem;
}

.info-section {
  margin-bottom: 2rem;
}

.info-section h3,
.items-section h3 {
  margin: 0;

  color: var(--text-color);

  font-size: 0.95rem;
  font-weight: 600;
}

.info-grid {
  display: grid;

  grid-template-columns: repeat(5, 1fr);

  gap: 1rem;

  margin-top: 1rem;

  padding: 1rem;

  border: 1px solid var(--color-border);

  border-radius: 12px;

  background-color: var(--tertiary-light-bg-color);
}

.info-item {
  display: flex;
  flex-direction: column;

  gap: 0.35rem;
}

.info-item span {
  color: var(--text-light-color);

  font-size: 0.72rem;
}

.info-item strong {
  color: var(--text-color);

  font-size: 0.85rem;
  font-weight: 600;
}

.items-section {
  width: 100%;
}

.section-title {
  margin-bottom: 1rem;
}

.section-title p {
  margin: 0.3rem 0 0;

  color: var(--text-light-color);

  font-size: 0.8rem;
}

.modal-footer {
  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 0.75rem;

  padding: 1rem 1.5rem;

  border-top: 1px solid var(--color-border);

  background-color: #ffffff;
}

.back-button,
.save-button {
  padding: 0.65rem 1.2rem;

  border-radius: 9999px;

  font-family: "Vend Sans", sans-serif;

  font-size: 0.8rem;
  font-weight: 500;

  cursor: pointer;

  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.back-button {
  border: 1px solid var(--color-border);

  background-color: #ffffff;

  color: var(--tertiary-text-color);
}

.back-button:hover {
  border-color: var(--color-border-hover);

  background-color: var(--color-background-mute);
}

.save-button {
  border: 1px solid var(--primary-color);

  background-color: var(--primary-color);

  color: #ffffff;
}

.save-button:hover {
  border-color: var(--primary-dark-bg-color);

  background-color: var(--primary-dark-bg-color);
}

@media (max-width: 900px) {
  .modal-overlay {
    align-items: flex-start;

    padding: 1rem;
  }

  .modal {
    width: 100%;

    max-height: 94vh;
  }

  .info-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .modal-body {
    padding: 1rem;
  }

  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .modal-footer {
    flex-direction: column-reverse;

    align-items: stretch;
  }

  .back-button,
  .save-button {
    width: 100%;
  }
}
</style>