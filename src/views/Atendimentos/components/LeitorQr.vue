<script setup>
import { ref } from 'vue'

const emit = defineEmits(['qr-lido'])

const codigo = ref('')
const erroCodigo = ref('')

function submeter() {
  erroCodigo.value = ''
  const codigoLimpo = codigo.value.trim()
  if (!codigoLimpo) {
    erroCodigo.value = 'Informe o código do QR.'
    return
  }
  emit('qr-lido', codigoLimpo)
}
</script>

<template>
  <form class="fx-cartao" @submit.prevent="submeter">
    <h2 class="fx-secao-titulo">Código do QR do beneficiário</h2>
    <p class="fx-suave">Digite ou cole o código que aparece abaixo do QR no celular do beneficiário.</p>

    <label class="fx-campo">
      Código do QR
      <input
        v-model="codigo"
        type="text"
        class="fx-entrada fx-mono"
        :class="{ 'fx-entrada-erro': erroCodigo }"
        placeholder="Ex.: a8f3c1d2-7b4e-4c19-9a55-0e1d2f3a4b5c"
        autocomplete="off"
      />
      <span v-if="erroCodigo" class="fx-erro-campo">{{ erroCodigo }}</span>
    </label>

    <button type="submit" class="fx-botao">Conferir</button>
  </form>
</template>
