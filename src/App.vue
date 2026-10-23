<template>
  <div class="app">
    <NavBar v-if="sessao.token && !$route.meta.publica" />
    <router-view :key="$route.fullPath" />
  </div>
</template>

<script setup>
import NavBar from './components/NavBar.vue'
import { sessao } from './stores/sessao.js'
</script>

<style>
.app {
  min-height: 100vh;
  width: 100%;
}
</style>
