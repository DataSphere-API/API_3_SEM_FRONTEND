<script setup>
import { ref, computed } from 'vue'
import PreGuiasLista from './components/PreGuiasLista.vue'
import PreGuiaDetalhe from './components/PreGuiaDetalhe.vue'

const props = defineProps({
  preGuias: {
    type: Array,
    required: true,
    default: () => []
  }
})

const emit = defineEmits(['atualizar'])

const preGuiaSelecionada = ref(null)

function abrirDetalhes(guia) {
  preGuiaSelecionada.value = typeof guia === 'object' ? guia : props.preGuias.find(g => g.id === guia)
}

function fecharDetalhes() {
  preGuiaSelecionada.value = null
}
</script>

<template>
  <div class="pre-guias-view">
    <PreGuiasLista
      v-if="!preGuiaSelecionada"
      :pre-guias="preGuias"
      @abrir="abrirDetalhes"
    />

    <PreGuiaDetalhe
      v-else
      :pre-guia="preGuiaSelecionada"
      @fechar="fecharDetalhes"
      @atualizar="$emit('atualizar')"
      @editar="(item) => console.log('Editar', item)"
      @enviar="(item) => console.log('Enviar', item)"
    />
  </div>
</template>

<style scoped>
.pre-guias-view {
  width: 100%;
}
</style>