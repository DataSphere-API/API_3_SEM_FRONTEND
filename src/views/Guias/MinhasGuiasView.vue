<script setup>
import { ref, onMounted } from 'vue'
import GuiasLista from './components/GuiasLista.vue'
import GuiaDetalhe from './components/GuiaDetalhe.vue'
import { listarGuias } from '../../services/guiasService.js'
import { sessao } from '../../stores/sessao.js'

// O beneficiário logado já tem Prec-CP: a busca manual só aparece sem ele.
const precCpDoLogin = sessao.usuario?.precCp || ''
const precCp = ref(precCpDoLogin)
const guias = ref([])
const carregando = ref(false)
const erro = ref('')
const consultou = ref(false)
const guiaSelecionada = ref(null)

let sequencia = 0

async function buscar() {
  const valor = precCp.value.trim()

  if (!valor) {
    erro.value = 'Informe o PrecCP do beneficiário.'
    return
  }

  const minhaSequencia = ++sequencia

  carregando.value = true
  erro.value = ''
  guias.value = []

  try {
    const lista = await listarGuias(valor)

    if (minhaSequencia === sequencia) {
      guias.value = lista
      consultou.value = true
    }
  } catch (e) {
    if (minhaSequencia === sequencia) {
      erro.value = e.mensagemUsuario || 'Não foi possível carregar as guias.'
      consultou.value = false
    }
  } finally {
    if (minhaSequencia === sequencia) {
      carregando.value = false
    }
  }
}

onMounted(() => {
  if (precCpDoLogin) buscar()
})
</script>

<template>
  <main class="fx-pagina">
    <div class="fx-conteudo">
      <header>
        <h1 class="fx-titulo">Minhas guias</h1>
        <p class="fx-subtitulo">
          Acompanhe o status das guias e o progresso de cada procedimento.
        </p>
      </header>

      <form v-if="!precCpDoLogin" class="fx-cartao busca" @submit.prevent="buscar">
        <label class="fx-campo">
          PrecCP do beneficiário
          <input
            v-model="precCp"
            type="text"
            class="fx-entrada"
            placeholder="Ex.: 100100100-00"
            autocomplete="off"
          />
        </label>

        <button type="submit" class="fx-botao" :disabled="carregando">
          Buscar guias
        </button>
      </form>

      <p v-if="carregando" class="fx-alerta fx-alerta-cinza" role="status">
        Carregando guias...
      </p>

      <div v-else-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">
        <p class="mensagem-erro">{{ erro }}</p>
        <button type="button" class="fx-botao-secundario" @click="buscar">
          Tentar novamente
        </button>
      </div>

      <p v-else-if="consultou && guias.length === 0" class="fx-alerta fx-alerta-cinza">
        Nenhuma guia encontrada para este beneficiário.
      </p>

      <GuiasLista
        v-else-if="guias.length > 0"
        :guias="guias"
        @abrir-guia="guiaSelecionada = $event"
      />
    </div>

    <GuiaDetalhe
      :aberto="guiaSelecionada !== null"
      :guia="guiaSelecionada"
      @fechar="guiaSelecionada = null"
    />
  </main>
</template>

<style scoped>
.busca {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-end;
}

.mensagem-erro {
  margin: 0 0 0.6rem;
}
</style>