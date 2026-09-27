<template>
  <div class="app">
    <NavBar />
    <router-view :key="$route.fullPath" />
  </div>
</template>

<script setup>
import NavBar from './components/NavBar.vue'
</script>

<style>
.app {
  min-height: 100vh;
  width: 100%;
}
</style>