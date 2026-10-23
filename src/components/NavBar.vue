<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { sessao, encerrarSessao } from '../stores/sessao.js'
import { PERFIS } from '../utils/perfis.js'

const router = useRouter()

const perfil = computed(() => PERFIS[sessao.perfilAtivo])
const temOutrosPerfis = computed(() => (sessao.usuario?.perfis.length || 0) > 1)

function sair() {
  encerrarSessao()
  router.push({ name: 'login' })
}
</script>

<template>
  <nav class="navbar">
    <div class="navbar-brand">
      <span>Sistema FUSEx</span>
      <small v-if="perfil" class="perfil-ativo">{{ perfil.rotulo }}</small>
    </div>

    <div v-if="perfil" class="navbar-links">
      <router-link
        v-for="item in perfil.menu"
        :key="item.rota"
        :to="item.rota"
        class="nav-link"
      >
        {{ item.rotulo }}
      </router-link>
    </div>

    <div class="navbar-usuario">
      <span class="nome-usuario">{{ sessao.usuario?.nome }}</span>
      <router-link v-if="temOutrosPerfis" to="/escolher-perfil" class="nav-link">Trocar perfil</router-link>
      <button type="button" class="nav-link botao-sair" @click="sair">Sair</button>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem 1.5rem;
  padding: 1rem 2rem;
  background-color: #ffffff;
  border-bottom: 1px solid var(--fx-borda, #dce0da);
  font-family: var(--fx-fonte, sans-serif);
}

.navbar-brand {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
}

.navbar-brand span {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--fx-verde, #1e4d36);
}

.perfil-ativo {
  font-size: 0.8rem;
  color: var(--fx-texto-suave, #55605a);
}

.navbar-links,
.navbar-usuario {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.nome-usuario {
  font-size: 0.85rem;
  color: var(--fx-texto-suave, #55605a);
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

.botao-sair {
  border: none;
  background: none;
  font-family: inherit;
  cursor: pointer;
}

@media (max-width: 640px) {
  .navbar {
    padding: 0.75rem 1rem;
  }
}
</style>
