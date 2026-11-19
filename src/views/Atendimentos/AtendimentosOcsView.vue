<script setup>
import { ref, computed, onMounted } from 'vue'
import { sessao } from '../../stores/sessao.js'
import { formatarData } from '../../utils/documentos.js'

const cnpj = sessao.usuario?.ocsCnpj
const atendimentos = ref([])
const carregando = ref(false)
const erro = ref('')
const busca = ref('')

const lista = computed(() => atendimentos.value)

async function carregar() {
  carregando.value = true
  try {
    atendimentos.value = []
  } catch (e) {
    erro.value = 'Não foi possível carregar os atendimentos.'
  } finally {
    carregando.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <main class="fx-pagina">
    <div class="fx-conteudo fx-conteudo-largo">
      <header>
        <h1 class="fx-titulo">Atendimentos</h1>
        <p class="fx-subtitulo">Gerenciamento de atendimentos por QR Code.</p>
      </header>
      <p v-if="carregando" class="fx-alerta fx-alerta-cinza">Carregando atendimentos...</p>
      <p v-else class="fx-alerta fx-alerta-cinza">Nenhum atendimento listado no momento.</p>
    </div>
  </main>
</template>