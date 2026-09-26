<template>
  <span
    class="status-badge"
    :class="`status-${status.toLowerCase()}`"
  >
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    default: ''
  }
})

const labels = {
  pendente_auditoria: 'Pendente de Auditoria',
  com_divergencia: 'Com Divergência',
  encaminhada: 'Encaminhada',
  aprovada: 'Aprovada'
}

const label = computed(() => {
  return labels[props.status.toLowerCase()] || props.status
})
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  font-family: "Vend Sans", "DM Sans", sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  letter-spacing: 0.01em;
}

.status-pendente_auditoria {
  background-color: #fef3c7;
  color: #92400e;
}

.status-com_divergencia {
  background-color: #fee2e2;
  color: #991b1b;
}

.status-encaminhada {
  background-color: #e0f2fe;
  color: #0369a1;
}

.status-aprovada {
  background-color: #e6f4ea;
  color: #137333;
}
</style>