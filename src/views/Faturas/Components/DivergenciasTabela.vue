<script setup>
import { ref, onMounted } from 'vue'
import { buscarDivergencias } from '../../../services/divergenciasService.js'

const props = defineProps({
  faturaId: {
    type: [Number, String],
    required: true
  }
})

const itens = ref([])
const carregando = ref(false)
const erro = ref('')

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    const dados = await buscarDivergencias(props.faturaId)
    itens.value = Array.isArray(dados) ? dados : []
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Erro ao carregar divergências.'
  } finally {
    carregando.value = false
  }
}

function classeSeveridade(sev) {
  const s = String(sev || '').toUpperCase()
  if (s === 'ALTA') return 'fx-selo-vermelho'
  if (s === 'MEDIA') return 'fx-selo-ambar'
  return 'fx-selo-azul'
}

onMounted(carregar)
</script>

<template>
  <div class="div-container">
    <div class="section-title">
      <h3>Divergências e Severidade</h3>
      <p>Análise detalhada por item de fatura.</p>
    </div>

    <p v-if="carregando" class="fx-alerta fx-alerta-cinza">Carregando divergências...</p>
    <div v-else-if="erro" class="fx-alerta fx-alerta-vermelho">
      <p>{{ erro }}</p>
      <button type="button" class="aud-retry" @click="carregar">Tentar novamente</button>
    </div>

    <div v-else-if="itens.length === 0" class="aud-estado">
      Nenhuma divergência encontrada nesta fatura.
    </div>

    <div v-else class="aud-table-wrapper">
      <table class="aud-table">
        <thead>
          <tr>
            <th>Item / Descrição</th>
            <th>Valor Divergente</th>
            <th>Autorização</th>
            <th>Severidade</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in itens" :key="idx">
            <td>
              <span class="aud-item-id">#{{ item.id ?? idx }}</span>
              <span class="aud-item-descricao">{{ item.descricao || 'Procedimento' }}</span>
            </td>
            <td class="aud-money">R$ {{ Number(item.valorDivergente || 0).toFixed(2) }}</td>
            <td>{{ item.autorizacao || '-' }}</td>
            <td>
              <span class="fx-selo" :class="classeSeveridade(item.severidade)">
                {{ item.severidade || 'BAIXA' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.div-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  text-align: center;
}
.aud-retry {
  min-height: 44px;
  padding: 0 1.1rem;
  border: 1px solid var(--fx-borda-forte);
  border-radius: 8px;
  background-color: #ffffff;
  color: var(--fx-texto);
  font-weight: 600;
  cursor: pointer;
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
}
.aud-table td {
  padding: 0.85rem 0.9rem;
  border-top: 1px solid var(--fx-borda);
  color: var(--fx-texto);
  font-size: 0.85rem;
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
}
</style>