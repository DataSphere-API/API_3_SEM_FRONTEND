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
  color: var(--fx-texto);
  font-family: var(--fx-fonte);
  font-size: 1.05rem;
  font-weight: 600;
}

.section-title p {
  margin: 0.3rem 0 0;
  color: var(--fx-texto-suave);
  font-family: var(--fx-fonte);
  font-size: 0.85rem;
}

.aud-estado {
  padding: 1.25rem;
  border: 1px solid var(--fx-borda);
  border-radius: 14px;
  background-color: #ffffff;
  color: var(--fx-texto-suave);
  font-family: var(--fx-fonte);
  font-size: 0.9rem;
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
  min-height: 44px;
  padding: 0 1.1rem;
  border: 1px solid var(--fx-borda-forte);
  border-radius: 8px;
  background-color: #ffffff;
  color: var(--fx-texto);
  font-family: var(--fx-fonte);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.aud-retry:hover {
  background-color: var(--fx-fundo);
}

.aud-resumo {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 0.75rem;
  color: var(--fx-texto-suave);
  font-family: var(--fx-fonte);
  font-size: 0.85rem;
}

.aud-table-wrapper {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--fx-borda);
  border-radius: 14px;
  background-color: #ffffff;
}

.aud-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--fx-fonte);
}

.aud-table thead {
  background-color: var(--fx-verde-claro);
}

.aud-table th {
  padding: 0.8rem 0.9rem;
  color: var(--fx-verde);
  font-size: 0.75rem;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
}

.aud-table td {
  padding: 0.85rem 0.9rem;
  border-top: 1px solid var(--fx-borda);
  color: var(--fx-texto);
  font-size: 0.85rem;
  vertical-align: top;
}

.aud-item-id {
  display: block;
  font-family: var(--fx-fonte-mono);
  font-weight: 500;
}

.aud-item-descricao {
  display: block;
  margin-top: 0.2rem;
  color: var(--fx-texto-suave);
}

.aud-money {
  font-family: var(--fx-fonte-mono);
  font-weight: 500;
  white-space: nowrap;
}

.aud-selo {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.65rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.aud-selo-autorizado {
  background-color: #e5eee8;
  color: #1e4d36;
}

.aud-selo-nao-autorizado {
  background-color: #fbe7e4;
  color: #a3261b;
}

.aud-motivo {
  min-width: 220px;
  color: var(--fx-texto-suave);
}
</style>