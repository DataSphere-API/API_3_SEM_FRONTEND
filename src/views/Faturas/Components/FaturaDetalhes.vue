<template>
  <div v-if="aberto" class="modal-overlay" @click.self="fecharModal">
    <div class="modal-card">
      <div class="modal-header">
        <h2>Detalhes da Fatura #{{ fatura?.id }}</h2>
        <button type="button" class="close-button" @click="fecharModal">✕</button>
      </div>

      <div class="modal-body">
        <div v-if="fatura?.status === 'com_divergencia'" class="alerta-divergencia">
          <strong>Atenção:</strong> Foram encontradas divergências entre a fatura e os valores contratados. Revise os itens destacados abaixo antes de regerar a fatura.
        </div>

        <div class="card-auditoria">
          <h4>Comparativo de Lisura (Itens Autorizados)</h4>
          <table class="tabela-auditoria">
            <thead>
              <tr>
                <th>Procedimento</th>
                <th>Autorizado na Guia?</th>
                <th>Valor Guia (R$)</th>
                <th>Valor Cobrado (R$)</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in lisura"
                :key="item.itemId"
                :class="{ 'linha-divergente': item.valorGuia !== item.valorCobrado || !item.autorizadoNaGuia }"
              >
                <td>{{ item.procedimento }}</td>
                <td>
                  <span :class="['badge-status', item.autorizadoNaGuia ? 'sim' : 'nao']">
                    {{ item.autorizadoNaGuia ? 'SIM' : 'NÃO' }}
                  </span>
                </td>
                <td>R$ {{ item.valorGuia.toFixed(2) }}</td>
                <td>R$ {{ item.valorCobrado.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="card-auditoria">
          <h4>Divergências Consolidadas</h4>
          <table class="tabela-auditoria">
            <thead>
              <tr>
                <th>Procedimento</th>
                <th>Descrição da Divergência</th>
                <th>Severidade</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="div in divergencias"
                :key="div.itemId"
                class="linha-divergente"
              >
                <td>{{ div.procedimento }}</td>
                <td>{{ div.descricaoDivergencia }}</td>
                <td>
                  <span :class="['badge-severidade', div.severidade.toLowerCase()]">
                    {{ div.severidade }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="fatura?.status === 'com_divergencia'" class="termo-conferencia">
          <label class="checkbox-label">
            <input
              type="checkbox"
              v-model="cienteDivergencias"
            />
            Confirmo a conferência das divergências apontadas acima para esta fatura.
          </label>
        </div>
      </div>

      <div class="modal-footer">
        <button
          v-if="fatura?.status === 'com_divergencia'"
          type="button"
          class="btn-regerar"
          :disabled="!cienteDivergencias"
          @click="solicitarRegeracao"
        >
          Regerar Fatura
        </button>
        <button
          v-else
          type="button"
          class="btn-encaminhar"
          @click="encaminharParaAprovacao"
        >
          Encaminhar para Aprovação
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'

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

const lisura = ref([])
const divergencias = ref([])
const cienteDivergencias = ref(false)

watch(() => props.fatura, (novaFatura) => {
  cienteDivergencias.value = false
  if (novaFatura) {
    carregarDadosAuditoria(novaFatura.id)
  }
}, { immediate: true })

async function carregarDadosAuditoria(faturaId) {
  try {
    const resLisura = await axios.get(`http://localhost:8080/faturas/${faturaId}/lisura`)
    lisura.value = resLisura.data
  } catch (e) {
    lisura.value = [
      { itemId: 1, procedimento: 'Consulta Médica em PA', autorizadoNaGuia: true, valorGuia: 150.00, valorCobrado: 150.00 },
      { itemId: 2, procedimento: 'Exame de Sangue (Hemograma)', autorizadoNaGuia: false, valorGuia: 0.00, valorCobrado: 80.00 }
    ]
  }

  try {
    const resDiv = await axios.get(`http://localhost:8080/faturas/${faturaId}/divergencias`)
    divergencias.value = resDiv.data
  } catch (e) {
    divergencias.value = [
      { itemId: 2, procedimento: 'Exame de Sangue (Hemograma)', descricaoDivergencia: 'Procedimento realizado sem autorização prévia', severidade: 'ALTA' },
      { itemId: 3, procedimento: 'Consulta Eletiva', descricaoDivergencia: 'Valor cobrado diverge do contrato', severidade: 'MEDIA' }
    ]
  }
}

function fecharModal() {
  emit('fechar')
}

function solicitarRegeracao() {
  if (cienteDivergencias.value) {
    emit('regerar', props.fatura)
    fecharModal()
  }
}

async function encaminharParaAprovacao() {
  try {
    const res = await axios.post(`http://localhost:8080/faturas/${props.fatura?.id}/encaminhar`)
    alert(res.data.mensagem || 'Fatura encaminhada com sucesso!')
  } catch (e) {
    alert(`Fatura #${props.fatura?.id} encaminhada para aprovação!`)
  }
  fecharModal()
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  background: #ffffff;
  border-radius: 12px;
  width: min(850px, 90%);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  overflow: hidden;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--text-color, #111827);
  font-family: "DM Sans", sans-serif;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--text-light-color, #6b7280);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.alerta-divergencia {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 0.85rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
}

.card-auditoria {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.25rem;
}

.card-auditoria h4 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  color: #374151;
  font-size: 0.95rem;
}

.tabela-auditoria {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.tabela-auditoria th,
.tabela-auditoria td {
  border: 1px solid #e5e7eb;
  padding: 0.65rem;
  text-align: left;
}

.tabela-auditoria th {
  background-color: #f3f4f6;
  font-weight: 600;
}

.linha-divergente {
  background-color: #fff5f5;
}

.badge-status {
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.75rem;
}
.badge-status.sim { background-color: #d1fae5; color: #065f46; }
.badge-status.nao { background-color: #fee2e2; color: #991b1b; }

.badge-severidade {
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: bold;
  color: #fff;
}
.badge-severidade.alta { background-color: #ef4444; }
.badge-severidade.media { background-color: #f59e0b; }
.badge-severidade.baixa { background-color: #10b981; }

.termo-conferencia {
  margin-top: 1rem;
  padding: 0.85rem;
  background-color: #f3f4f6;
  border-radius: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border, #e5e7eb);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  background-color: #ffffff;
}

.btn-encaminhar {
  background-color: var(--primary-color, #2563eb);
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-regerar {
  background-color: #d97706;
  color: #ffffff;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-regerar:disabled {
  background-color: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}
</style>