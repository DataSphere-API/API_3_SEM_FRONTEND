<template>
  <div class="app">
    <EspelhosView />
    <FaturasView />
  </div>
</template>

<script setup>
import EspelhosView from './views/Espelhos/EspelhosViews.vue'
import FaturasView from './views/Faturas/FaturasViews.vue'
</script>

<style>
.app {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}
</style>