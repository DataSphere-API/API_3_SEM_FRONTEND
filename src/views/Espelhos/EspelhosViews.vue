<template>
  <div class="espelhos-page">
    <main class="page-content">
      <header class="page-header">
        <div>
          <h1>Espelhos</h1>

          <p>
            Consulte os espelhos recebidos das OCS e suas respectivas guias.
          </p>
        </div>
      </header>

      <section class="section-card">
        <div class="section-header">
          <div>
            <h2>Espelhos existentes</h2>

            <p>
              Consulte os espelhos recebidos e os valores correspondentes.
            </p>
          </div>
        </div>

        <EspelhosList
          :espelhos="espelhos"
          @visualizar="visualizarEspelho"
        />
      </section>
    </main>

    <EspelhoDetalhes
      :aberto="modalAberto"
      :espelho="espelhoSelecionado"
      @fechar="fecharDetalhes"
      @salvar="salvarEspelho"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import axios from 'axios'
import EspelhosList from './components/EspelhosList.vue'
import EspelhoDetalhes from './components/EspelhoDetalhes.vue'

const modalAberto = ref(false)
const espelhoSelecionado = ref(null)
const espelhos = ref([])

async function carregarEspelhos() {
  try {
    const response = await axios.get('http://localhost:8080/espelhos')

    espelhos.value = response.data.map(espelho => ({
      ...espelho,
      ocs: espelho.ocsId,
      data: `${espelho.dataInicio} - ${espelho.dataFim}`,
      status: espelho.status.toLowerCase()
    }))
  } catch (error) {
    console.error('Erro ao carregar espelhos:', error)
  }
}

function visualizarEspelho(espelho) {
  espelhoSelecionado.value = espelho
  modalAberto.value = true
}

function fecharDetalhes() {
  modalAberto.value = false
  espelhoSelecionado.value = null
}

function salvarEspelho(espelhoAtualizado) {
  const index = espelhos.value.findIndex(
    espelho => espelho.id === espelhoAtualizado.id
  )

  if (index === -1) {
    return
  }

  espelhos.value[index] = espelhoAtualizado
  espelhoSelecionado.value = espelhoAtualizado
}

onMounted(() => {
  carregarEspelhos()
})
</script>

<style scoped>
.espelhos-page {
  min-height: 100vh;
  padding: 2.5rem 1.5rem;
  background-color: var(--color-background);
}

.page-content {
  width: min(1200px, 100%);
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0;
  color: var(--text-color);
  font-family: "DM Sans", sans-serif;
  font-size: 1.8rem;
  font-weight: 700;
}

.page-header p {
  margin: 0.5rem 0 0;
  color: var(--text-light-color);
  font-size: 0.9rem;
}

.section-card {
  padding: 1.5rem;
  background-color: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(var(--text-color-decimal), 0.04);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  margin: 0;
  color: var(--text-color);
  font-family: "DM Sans", sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
}

.section-header p {
  margin: 0.35rem 0 0;
  color: var(--text-light-color);
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .espelhos-page {
    padding: 1.5rem 1rem;
  }

  .section-card {
    padding: 1rem;
  }
}
</style>