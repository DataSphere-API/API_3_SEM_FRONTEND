<template>
  <span
    class="status-badge"
    :class="`status-${status}`"
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
  pendente: 'Pendente',
  gerada: 'Gerada',
  regerada: 'Regerada'
}

const label = computed(() => {
  return labels[props.status] || props.status
})
</script>

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

.status-pendente {
  background-color: #FFF4D6;
  color: #9A6B00;
}

.status-gerada {
  background-color: var(--primary-light-bg-color);
  color: var(--secondary-text-color);
}

.status-regerada {
  background-color: var(--secondary-color);
  color: var(--text-color);
}
</style>