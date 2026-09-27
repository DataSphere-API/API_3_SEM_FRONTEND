<script setup>
import { onMounted, ref } from 'vue'
import axios from 'axios'
import FaturasList from './Components/FaturasList.vue'
import FaturaDetalhes from './Components/FaturaDetalhes.vue'

const modalAberto = ref(false)
const faturaSelecionada = ref(null)
const faturas = ref([])

function mapearFatura(fatura) {
  return {
    ...fatura,
    ocs: fatura.ocsNome || fatura.ocsId,
    data: formatarData(fatura.dataGeracao),
    status: fatura.status.toLowerCase()
  }
}

function formatarData(data) {
  if (!data) {
    return '-'
  }

  const dataObjeto = new Date(data)

  if (Number.isNaN(dataObjeto.getTime())) {
    return data
  }

  return new Intl.DateTimeFormat('pt-BR').format(dataObjeto)
}

async function carregarFaturas() {
  try {
    const response = await axios.get('http://localhost:8080/faturas')

    faturas.value = response.data.map(mapearFatura)
  } catch (error) {
    console.error('Erro ao carregar faturas:', error)
  }
}

function visualizarFatura(fatura) {
  faturaSelecionada.value = fatura
  modalAberto.value = true
}

function fecharDetalhes() {
  modalAberto.value = false
  faturaSelecionada.value = null
}

async function regerarFatura(fatura) {
  try {
    const response = await axios.post(
      `http://localhost:8080/faturas/${fatura.id}/regerar`
    )

    const novaFatura = mapearFatura(response.data)

    faturas.value = [
      ...faturas.value.map(item => {
        if (item.id === fatura.id) {
          return {
            ...item,
            status: 'regerada'
          }
        }

        return item
      }),
      novaFatura
    ]

    faturaSelecionada.value = novaFatura
  } catch (error) {
    alert(
      error.response?.data ||
      'Não foi possível regerar a fatura.'
    )
  }
}

onMounted(() => {
  carregarFaturas()
})
</script>

<template>
  <div class="faturas-page">
    <div class="page-content">

      <div class="page-header">
        <h1>Faturas</h1>
        <p>Acompanhe faturas geradas e regeradas.</p>
      </div>

      <div class="section-card">
        <FaturasList
          :faturas="faturas"
          @visualizar="visualizarFatura"
        />
      </div>

    </div>

    <FaturaDetalhes
      :aberto="modalAberto"
      :fatura="faturaSelecionada"
      @fechar="fecharDetalhes"
      @regerar="regerarFatura"
    />
  </div>
</template>

<style scoped>
.faturas-page {
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
}

@media (max-width: 768px) {
  .faturas-page {
    padding: 1.5rem 1rem;
  }

  .section-card {
    padding: 1rem;
  }
}
</style>