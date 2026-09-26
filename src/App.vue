<template>
  <div class="app">
    <header class="main-header">
      <nav class="nav-tabs">
        <button
          type="button"
          :class="['nav-tab', abaAtiva === 'espelhos' ? 'active' : '']"
          @click="abaAtiva = 'espelhos'"
        >
          Espelhos
        </button>
        <button
          type="button"
          :class="['nav-tab', abaAtiva === 'faturas' ? 'active' : '']"
          @click="abaAtiva = 'faturas'"
        >
          Faturas
        </button>
      </nav>
    </header>

    <main class="content">
      <EspelhosView v-if="abaAtiva === 'espelhos'" />
      <FaturasView v-if="abaAtiva === 'faturas'" />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import EspelhosView from './views/Espelhos/EspelhosViews.vue'
import FaturasView from './views/Faturas/FaturasViews.vue'

const abaAtiva = ref('espelhos')
</script>

<style scoped>
.app {
  min-height: 100vh;
  background-color: var(--color-background, #f9fafb);
  display: flex;
  flex-direction: column;
}

.main-header {
  background-color: #ffffff;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  padding: 0 1.5rem;
}

.nav-tabs {
  display: flex;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.nav-tab {
  padding: 1rem 1.25rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-light-color, #6b7280);
  font-family: "DM Sans", sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-tab:hover {
  color: var(--text-color, #111827);
}

.nav-tab.active {
  color: var(--primary-color, #2563eb);
  border-bottom-color: var(--primary-color, #2563eb);
}

.content {
  flex: 1;
}
</style>