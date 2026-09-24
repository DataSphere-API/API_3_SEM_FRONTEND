<template>
  <span
    class="status-badge"
    :class="`status-${status}`"
  >
    {{ statusFormatado }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    default: 'aberto'
  }
})

const statusFormatado = computed(() => {
  const statusMap = {
    aberto: 'Em aberto',
    faturado: 'Faturado',
    cancelado: 'Cancelado'
  }

  return statusMap[props.status] || props.status
})
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 0.35rem 0.7rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-aberto {
  background-color: var(--primary-light-bg-color);
  color: var(--secondary-text-color);
}

.status-faturado {
  background-color: var(--secondary-light-bg-color);
  color: var(--secondary-text-color);
}

.status-cancelado {
  background-color: var(--color-background-mute);
  color: var(--tertiary-text-color);
}
</style>