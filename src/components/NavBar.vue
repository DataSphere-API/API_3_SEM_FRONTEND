<script setup>
</script>

<template>
  <nav class="navbar">
    <div class="navbar-brand">
      <span>Sistema FUSEx</span>
    </div>

    <div class="navbar-links">
      <router-link to="/espelhos" class="nav-link">Espelhos</router-link>
      <router-link to="/faturas" class="nav-link">Faturas</router-link>
      <router-link to="/minhas-guias" class="nav-link">Minhas Guias</router-link>
      <router-link to="/atendimento" class="nav-link">Atendimento</router-link>
      <router-link to="/pre-guias" class="nav-link">Pré-Guias</router-link>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #ffffff;
  border-bottom: 1px solid var(--fx-borda, #dce0da);
  font-family: var(--fx-fonte, sans-serif);
}

.navbar-brand span {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--fx-verde, #1e4d36);
}

.navbar-links {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--fx-texto-suave, #55605a);
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: var(--fx-verde, #1e4d36);
  background-color: var(--fx-verde-claro, #e5eee8);
}

.nav-link.router-link-active {
  color: #ffffff;
  background-color: var(--fx-verde, #1e4d36);
}
</style>