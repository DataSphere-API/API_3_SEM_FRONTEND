<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { sessao, escolherPerfil, encerrarSessao } from '../../stores/sessao.js'
import { PERFIS } from '../../utils/perfis.js'

const route = useRoute()
const router = useRouter()

const perfis = computed(() =>
  (sessao.usuario?.perfis || []).map(codigo => ({ codigo, ...PERFIS[codigo] }))
)

function entrarCom(perfil) {
  escolherPerfil(perfil.codigo)
  router.push(route.query.voltar || perfil.rotaInicial)
}

function sair() {
  encerrarSessao()
  router.push({ name: 'login' })
}
</script>

<template>
  <main class="fx-pagina">
    <div class="fx-conteudo">
      <header>
        <h1 class="fx-titulo">Olá, {{ sessao.usuario?.nome }}</h1>
        <p class="fx-subtitulo">
          Com qual perfil você quer entrar? Você pode trocar a qualquer momento pelo menu.
        </p>
      </header>

      <ul class="fx-lista">
        <li v-for="perfil in perfis" :key="perfil.codigo">
          <button
            type="button"
            class="fx-cartao opcao"
            :class="{ atual: perfil.codigo === sessao.perfilAtivo }"
            @click="entrarCom(perfil)"
          >
            <strong>{{ perfil.rotulo }}</strong>
            <span class="fx-suave">{{ perfil.descricao }}</span>
            <span v-if="perfil.codigo === sessao.perfilAtivo" class="fx-selo fx-selo-verde">Perfil atual</span>
          </button>
        </li>
      </ul>

      <div>
        <button type="button" class="fx-botao-secundario" @click="sair">Sair</button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.opcao {
  width: 100%;
  align-items: flex-start;
  font-family: inherit;
  font-size: 1rem;
  text-align: left;
  color: var(--fx-texto);
  cursor: pointer;
}

.opcao:hover,
.opcao.atual {
  border-color: var(--fx-verde);
}
</style>
