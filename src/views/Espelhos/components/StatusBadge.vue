<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    default: ''
  }
})

const labels = {
  ativa: 'Ativa',
  regerada: 'Regerada',
  em_aberto: 'Em auditoria',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado · corrigir',
  faturado: 'Faturado',
  cancelado: 'Cancelado'
}

const label = computed(() => labels[props.status] || props.status)
</script>

<template>
  <span class="status-badge" :class="`status-${status}`">{{ label }}</span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.7rem;
  border-radius: 9999px;
  font-family: "Vend Sans", sans-serif;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-ativa {
  background-color: var(--primary-light-bg-color);
  color: var(--secondary-text-color);
}

.status-regerada {
  background-color: var(--secondary-color);
  color: var(--text-color);
}

.status-em_aberto {
  background-color: #fbf1dc;
  color: #7a4f00;
}

.status-aprovado {
  background-color: #e5eee8;
  color: #1e4d36;
}

.status-reprovado {
  background-color: #fbe7e4;
  color: #a3261b;
}
</style>