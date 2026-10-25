<script setup>
import {
  alertaValidade,
  guiaExpirada,
  rotuloStatus,
  tomStatus
} from '../../../utils/guiaRegras.js'

defineProps({
  guias: {
    type: Array,
    required: true
  }
})

defineEmits(['abrir-detalhe', 'abrir-qrcode'])

function temSessoesPendentes(proc) {
  const realizada = Number(proc.qtdRealizada || 0)
  const autorizada = Number(proc.qtdAutorizada || 0)
  return realizada < autorizada
}

function procedimentoConcluido(proc) {
  const realizada = Number(proc.qtdRealizada || 0)
  const autorizada = Number(proc.qtdAutorizada || 0)
  return realizada >= autorizada
}
</script>

<template>
  <ul class="fx-lista">
    <li v-for="(guia, indice) in guias" :key="indice" class="fx-cartao">
      <div class="guia-topo">
        <div class="guia-identificacao">
          <span class="fx-mono guia-numero">{{ guia.numero || 'Guia sem número' }}</span>
          <span class="fx-suave">{{ guia.procedimentos.length }} procedimento(s)</span>
        </div>

        <span class="fx-selo" :class="'fx-selo-' + tomStatus(guia.status)">
          {{ rotuloStatus(guia.status) }}
        </span>
      </div>

      <p v-if="alertaValidade(guia)" class="fx-alerta fx-alerta-ambar" role="alert">
        {{ alertaValidade(guia) }}
      </p>

      <div class="procedimentos-resumo">
        <div v-for="(proc, i) in guia.procedimentos" :key="i" class="proc-item-linha">
          <div class="proc-info">
            <span class="proc-nome">{{ proc.descricao || proc.nome || 'Procedimento' }}</span>
            <span v-if="procedimentoConcluido(proc)" class="fx-suave texto-concluido">
              Sessões: {{ proc.qtdRealizada }} / {{ proc.qtdAutorizada }} (Todas realizadas)
            </span>
            <span v-else class="fx-suave">
              Sessões: {{ proc.qtdRealizada || 0 }} / {{ proc.qtdAutorizada }}
            </span>
          </div>

          <div class="proc-acoes">
            <button
              v-if="temSessoesPendentes(proc) && !guiaExpirada(guia)"
              type="button"
              class="btn-acao-mini"
              @click="$emit('abrir-qrcode', { guia, procedimento: proc })"
            >
              Ver QR Code
            </button>
            <span v-else-if="procedimentoConcluido(proc)" class="fx-selo fx-selo-cinza">Concluído</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        class="fx-botao"
        @click="$emit('abrir-detalhe', guia)"
      >
        Ver detalhes
      </button>
    </li>
  </ul>
</template>

<style scoped>
.guia-topo {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}
.guia-identificacao {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.guia-numero {
  font-size: 1rem;
  font-weight: 500;
}
.procedimentos-resumo {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1rem 0;
  padding: 0.5rem 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}
.proc-item-linha {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  font-size: 0.85rem;
}
.proc-info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.proc-nome {
  font-weight: 500;
  color: #333;
}
.texto-concluido {
  color: var(--fx-verde, #2e7d32);
  font-weight: 600;
}
.btn-acao-mini {
  background-color: var(--fx-verde, #1e4d36);
  color: #fff;
  border: none;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}
.btn-acao-mini:hover {
  opacity: 0.9;
}
</style>