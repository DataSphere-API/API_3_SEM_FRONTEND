<script setup>
import { formatarDataHora } from '../utils/documentos.js'

// eventos no formato do HistoricoStatusResponse (US001-3).
defineProps({
  eventos: { type: Array, required: true }
})

const STATUS = {
  PENDENTE: 'A realizar',
  EM_ANDAMENTO: 'Em andamento',
  REALIZADA: 'Realizado',
  FATURADA: 'Faturado',
  EM_ABERTO: 'Recebido para auditoria',
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado e devolvido à OCS',
  FATURADO: 'Faturado',
  CANCELADO: 'Cancelado'
}

const ORIGEM = {
  'emissao-da-guia': 'Guia emitida pelo FUSEx',
  'confirmacao-do-beneficiario': 'Confirmado pelo beneficiário',
  'envio-pela-ocs': 'Enviado pela OCS',
  'reenvio-pela-ocs': 'Corrigido e reenviado pela OCS',
  auditoria: 'Auditoria'
}

function rotulo(status) {
  return STATUS[status] || status
}
</script>

<template>
  <p v-if="eventos.length === 0" class="fx-suave vazio">Nenhuma mudança registrada.</p>
  <ol v-else class="linha">
    <li v-for="e in eventos" :key="e.id" class="evento">
      <span class="marcador" aria-hidden="true"></span>
      <div>
        <strong>{{ rotulo(e.statusNovo) }}</strong>
        <span v-if="e.statusAnterior" class="fx-suave"> (antes: {{ rotulo(e.statusAnterior) }})</span>
        <div class="fx-suave">{{ formatarDataHora(e.data) }} · {{ ORIGEM[e.origem] || e.origem }}</div>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.vazio {
  margin: 0;
}

.linha {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.evento {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.marcador {
  flex: none;
  width: 10px;
  height: 10px;
  margin-top: 0.4rem;
  border-radius: 50%;
  background-color: var(--fx-verde);
}
</style>
