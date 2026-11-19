<script setup>
import { ref, onMounted } from 'vue'
import { sessao } from '../../stores/sessao.js'

const precCp = sessao.usuario?.precCp
const pendentes = ref([])
const carregando = ref(false)

onMounted(() => {
  pendentes.value = []
})
</script>

<template>
  <main class="fx-pagina">
    <div class="fx-conteudo">
      <header>
        <h1 class="fx-titulo">Confirmar atendimento</h1>
        <p class="fx-subtitulo">Validação de sessões via QR Code.</p>
      </header>
      <p class="fx-alerta fx-alerta-cinza">Nenhum atendimento pendente.</p>
    </div>
  </main>
</template>