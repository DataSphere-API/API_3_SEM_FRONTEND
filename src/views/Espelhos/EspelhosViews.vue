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
      ocs: espelho.ocsNome || espelho.ocsId,
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

<template>
  <div class="espelhos-page">
    <div class="page-content">
      <div class="page-header">
        <div class="header-row">
          <div>
            <h1>Espelhos</h1>
            <p>Acompanhe e corrija os espelhos gerados.</p>
          </div>

          <router-link to="/espelhos/novo" class="new-button">
            + Novo espelho
          </router-link>
        </div>
      </div>

      <div class="section-card">
        <EspelhosList
          :espelhos="espelhos"
          @visualizar="visualizarEspelho"
        />
      </div>
    </div>

    <EspelhoDetalhes
      :aberto="modalAberto"
      :espelho="espelhoSelecionado"
      @fechar="fecharDetalhes"
      @salvar="salvarEspelho"
    />
  </div>
</template>

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

.header-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
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
}

.new-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0.7rem 1.2rem;
  border: 1px solid var(--primary-color);
  border-radius: 9999px;
  background-color: var(--primary-color);
  color: #ffffff;
  font-family: "Vend Sans", sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.new-button:hover {
  background-color: var(--primary-dark-bg-color);
  border-color: var(--primary-dark-bg-color);
}

@media (max-width: 768px) {
  .espelhos-page {
    padding: 1.5rem 1rem;
  }

  .header-row {
    flex-direction: column;
    align-items: stretch;
  }

  .new-button {
    width: 100%;
  }

  .section-card {
    padding: 1rem;
  }
}
</style>