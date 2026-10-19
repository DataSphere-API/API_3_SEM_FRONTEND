<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { buscarLisura } from '../../../services/lisuraService.js'
import { avaliarItem, formatarMoeda } from '../../../utils/avaliarLisura.js'

const props = defineProps({
  faturaId: {
    type: [Number, String],
    required: true
  }
})

const carregando = ref(false)
const erro = ref('')
const itens = ref([])

let sequencia = 0
let controlador = null

async function carregar() {
  controlador?.abort()
  controlador = new AbortController()

  const minhaSequencia = ++sequencia

  carregando.value = true
  erro.value = ''
  itens.value = []

  try {
    const lisura = await buscarLisura(props.faturaId, {
      signal: controlador.signal
    })

    if (minhaSequencia !== sequencia) {
      return
    }

    itens.value = (lisura.itens || []).map(item => ({
      ...item,
      avaliacao: avaliarItem(item)
    }))
  } catch (e) {
    if (e.cancelado || minhaSequencia !== sequencia) {
      return
    }

    erro.value = e.mensagemUsuario
  } finally {
    if (minhaSequencia === sequencia) {
      carregando.value = false
    }
  }
}

watch(() => props.faturaId, carregar, { immediate: true })

onBeforeUnmount(() => {
  sequencia++
  controlador?.abort()
})

const totalAutorizados = computed(
  () => itens.value.filter(item => item.avaliacao.autorizado).length
)

const totalNaoAutorizados = computed(
  () => itens.value.length - totalAutorizados.value
)
</script>

<template>
  <section class="aba-auditoria">
    <div class="section-title">
      <h3>Auditoria de Lisura</h3>
      <p>
        Comparação entre o valor apresentado na fatura e o valor contratado, item a item.
      </p>
    </div>

    <div v-if="carregando" class="aud-estado" role="status">
      Carregando auditoria...
    </div>

    <div v-else-if="erro" class="aud-estado aud-erro" role="alert">
      <p>{{ erro }}</p>
      <button type="button" class="aud-retry" @click="carregar">
        Tentar novamente
      </button>
    </div>

    <div v-else-if="itens.length === 0" class="aud-estado">
      Nenhum item encontrado para esta fatura.
    </div>

    <template v-else>
      <div class="aud-resumo">
        <span>
          Autorizados: <strong>{{ totalAutorizados }}</strong>
        </span>
        <span>
          Não autorizados: <strong>{{ totalNaoAutorizados }}</strong>
        </span>
      </div>

      <div class="aud-table-wrapper">
        <table class="aud-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Valor apresentado</th>
              <th>Valor contratado</th>
              <th>Status</th>
              <th>Motivo</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(item, indice) in itens"
              :key="`${indice}-${item.espelhoItemId || item.id}`"
            >
              <td>
                <span class="aud-item-id">
                  {{ item.espelhoItemId !== null && item.espelhoItemId !== undefined ? `#${item.espelhoItemId}` : '—' }}
                </span>
                <span v-if="item.descricao" class="aud-item-descricao">
                  {{ item.descricao }}
                </span>
              </td>

              <td>
                <span class="aud-money">
                  {{ formatarMoeda(item.valorApresentado) }}
                </span>
              </td>

              <td>
                <span class="aud-money">
                  {{ item.valorContratado !== null ? formatarMoeda(item.valorContratado) : '—' }}
                </span>
              </td>

              <td>
                <span
                  class="aud-selo"
                  :class="
                    item.avaliacao.autorizado
                      ? 'aud-selo-autorizado'
                      : 'aud-selo-nao-autorizado'
                  "
                >
                  {{ item.avaliacao.status }}
                </span>
              </td>

              <td class="aud-motivo">
                {{ item.avaliacao.motivo || '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>

<style scoped>
.section-title {
  margin-bottom: 1rem;
}

.section-title h3 {
  margin: 0;
  color: var(--text-color, #111827);
  font-size: 1rem;
  font-weight: 600;
}

.section-title p {
  margin: 0.3rem 0 0;
  color: var(--text-light-color, #6b7280);
  font-size: 0.8rem;
}

.aud-estado {
  padding: 1.5rem;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 12px;
  background-color: var(--tertiary-light-bg-color, #f9fafb);
  color: var(--tertiary-text-color, #4b5563);
  font-size: 0.85rem;
  text-align: center;
}

.aud-erro {
  border-color: #f0c4be;
  background-color: #fbe7e4;
  color: #a3261b;
}

.aud-erro p {
  margin: 0 0 0.75rem;
}

.aud-retry {
  padding: 0.55rem 1rem;
  border: 1px solid #a3261b;
  border-radius: 9999px;
  background-color: #ffffff;
  color: #a3261b;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
}

.aud-retry:hover {
  background-color: #fbe7e4;
}

.aud-resumo {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 0.75rem;
  color: var(--tertiary-text-color, #4b5563);
  font-size: 0.8rem;
}

.aud-table-wrapper {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 12px;
}

.aud-table {
  width: 100%;
  border-collapse: collapse;
}

.aud-table thead {
  background-color: var(--primary-light-bg-color, #f3f4f6);
}

.aud-table th {
  padding: 0.8rem 0.9rem;
  color: var(--secondary-text-color, #374151);
  font-size: 0.75rem;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
}

.aud-table td {
  padding: 0.85rem 0.9rem;
  border-top: 1px solid var(--color-border, #e5e7eb);
  color: var(--tertiary-text-color, #4b5563);
  font-size: 0.8rem;
  vertical-align: top;
}

.aud-item-id {
  display: block;
  color: var(--secondary-text-color, #374151);
  font-weight: 600;
}

.aud-item-descricao {
  display: block;
  margin-top: 0.2rem;
  color: var(--text-light-color, #6b7280);
}

.aud-money {
  color: var(--text-color, #111827);
  font-weight: 600;
  white-space: nowrap;
}

.aud-selo {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.7rem;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.aud-selo-autorizado {
  background-color: #e3f1e7;
  color: #1e6b3a;
}

.aud-selo-nao-autorizado {
  background-color: #fbe7e4;
  color: #a3261b;
}

.aud-motivo {
  min-width: 220px;
}
</style>