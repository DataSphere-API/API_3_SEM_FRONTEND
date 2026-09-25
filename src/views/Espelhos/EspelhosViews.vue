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
import { ref } from 'vue'
import EspelhosList from './components/EspelhosList.vue'
import EspelhoDetalhes from './components/EspelhoDetalhes.vue'

const modalAberto = ref(false)
const espelhoSelecionado = ref(null)

const espelhos = ref([
  {
    id: 1,
    ocs: 'Plani',
    data: '18/09/2026',
    status: 'aberto',
    guias: [
      {
        id: 202611463,
        procedimento: 'Consulta médica',
        paciente: 'João da Silva',
        precoPadrao: 180,
        precoCorrigido: 180
      },
      {
        id: 202611464,
        procedimento: 'Exame de imagem',
        paciente: 'Maria Oliveira',
        precoPadrao: 320,
        precoCorrigido: 320
      },
      {
        id: 202611465,
        procedimento: 'Exame laboratorial',
        paciente: 'Carlos Souza',
        precoPadrao: 145,
        precoCorrigido: 145
      },
      {
        id: 202611466,
        procedimento: 'Consulta cardiológica',
        paciente: 'Ana Pereira',
        precoPadrao: 210,
        precoCorrigido: 210
      }
    ]
  },
  {
    id: 1,
    ocs: 'Santa Casa',
    data: '19/09/2026',
    status: 'aberto',
    guias: [
      {
        id: 202611520,
        procedimento: 'Consulta ortopédica',
        paciente: 'Pedro Santos',
        precoPadrao: 190,
        precoCorrigido: 190
      },
      {
        id: 202611521,
        procedimento: 'Raio-X',
        paciente: 'Juliana Costa',
        precoPadrao: 95,
        precoCorrigido: 95
      },
      {
        id: 202611522,
        procedimento: 'Ultrassonografia',
        paciente: 'Lucas Almeida',
        precoPadrao: 170,
        precoCorrigido: 170
      }
    ]
  },
  {
    id: 2,
    ocs: 'Plani',
    data: '20/09/2026',
    status: 'faturado',
    guias: [
      {
        id: 202611580,
        procedimento: 'Ressonância magnética',
        paciente: 'Fernanda Lima',
        precoPadrao: 450,
        precoCorrigido: 450
      },
      {
        id: 202611581,
        procedimento: 'Tomografia computadorizada',
        paciente: 'Rafael Martins',
        precoPadrao: 380,
        precoCorrigido: 380
      }
    ]
  },
  {
    id: 1,
    ocs: 'Hospital Municipal',
    data: '21/09/2026',
    status: 'cancelado',
    guias: [
      {
        id: 202611620,
        procedimento: 'Consulta clínica',
        paciente: 'Marcos Oliveira',
        precoPadrao: 150,
        precoCorrigido: 150
      },
      {
        id: 202611621,
        procedimento: 'Exame laboratorial',
        paciente: 'Patrícia Souza',
        precoPadrao: 125,
        precoCorrigido: 125
      },
      {
        id: 202611622,
        procedimento: 'Eletrocardiograma',
        paciente: 'Bruno Ferreira',
        precoPadrao: 80,
        precoCorrigido: 80
      }
    ]
  },
  {
    id: 1,
    ocs: 'Hospital São José',
    data: '22/09/2026',
    status: 'aberto',
    guias: [
      {
        id: 202611700,
        procedimento: 'Consulta dermatológica',
        paciente: 'Camila Rodrigues',
        precoPadrao: 160,
        precoCorrigido: 160
      },
      {
        id: 202611701,
        procedimento: 'Ultrassonografia',
        paciente: 'Diego Martins',
        precoPadrao: 175,
        precoCorrigido: 175
      },
      {
        id: 202611702,
        procedimento: 'Consulta oftalmológica',
        paciente: 'Larissa Mendes',
        precoPadrao: 185,
        precoCorrigido: 185
      },
      {
        id: 202611703,
        procedimento: 'Exame de imagem',
        paciente: 'Gustavo Alves',
        precoPadrao: 290,
        precoCorrigido: 290
      },
      {
        id: 202611704,
        procedimento: 'Consulta neurológica',
        paciente: 'Beatriz Santos',
        precoPadrao: 230,
        precoCorrigido: 230
      }
    ]
  }
])

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
    espelho =>
      espelho.id === espelhoAtualizado.id &&
      espelho.ocs === espelhoAtualizado.ocs
  )

  if (index === -1) {
    return
  }

  espelhos.value[index] = espelhoAtualizado
  espelhoSelecionado.value = espelhoAtualizado
}
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