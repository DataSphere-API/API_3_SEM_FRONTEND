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
  regerada: 'Regerada'
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
</style>