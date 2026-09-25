<template>
  <div class="faturas-page">
    <main class="page-content">
      <header class="page-header">
        <div>
          <h1>Faturas</h1>
          <p>Consulte as faturas geradas a partir dos espelhos.</p>
        </div>
      </header>

      <section class="section-card">
        <div class="section-header">
          <div>
            <h2>Faturas existentes</h2>
            <p>Consulte as faturas, seus valores e divergências.</p>
          </div>
        </div>

        <FaturasList
          :faturas="faturas"
          @visualizar="visualizarFatura"
        />
      </section>
    </main>

    <FaturaDetalhes
      :aberto="modalAberto"
      :fatura="faturaSelecionada"
      @fechar="fecharDetalhes"
      @regerar="regerarFatura"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import FaturasList from './Components/FaturasList.vue'
import FaturaDetalhes from './Components/FaturaDetalhes.vue'

const modalAberto = ref(false)
const faturaSelecionada = ref(null)

const faturas = ref([
  {
    id: 5001,
    ocs: 'Plani',
    espelhoId: 1,
    data: '20/09/2026',
    status: 'gerada',
    podeRegerar: false,
    itens: [
      { guiaId: 202611463, procedimento: 'Consulta médica', paciente: 'João da Silva', valorApresentado: 180, valorContratado: 160 },
      { guiaId: 202611464, procedimento: 'Exame de imagem', paciente: 'Maria Oliveira', valorApresentado: 320, valorContratado: 320 },
      { guiaId: 202611465, procedimento: 'Exame laboratorial', paciente: 'Carlos Souza', valorApresentado: 145, valorContratado: 120 },
      { guiaId: 202611466, procedimento: 'Consulta cardiológica', paciente: 'Ana Pereira', valorApresentado: 210, valorContratado: 190 }
    ]
  },
  {
    id: 5002,
    ocs: 'Santa Casa',
    espelhoId: 1,
    data: '21/09/2026',
    status: 'gerada',
    podeRegerar: true,
    itens: [
      { guiaId: 202611520, procedimento: 'Consulta ortopédica', paciente: 'Pedro Santos', valorApresentado: 190, valorContratado: 180 },
      { guiaId: 202611521, procedimento: 'Raio-X', paciente: 'Juliana Costa', valorApresentado: 95, valorContratado: 95 },
      { guiaId: 202611522, procedimento: 'Ultrassonografia', paciente: 'Lucas Almeida', valorApresentado: 170, valorContratado: 150 }
    ]
  },
  {
    id: 5003,
    ocs: 'Hospital Municipal',
    espelhoId: 1,
    data: '22/09/2026',
    status: 'pendente',
    podeRegerar: false,
    itens: [
      { guiaId: 202611620, procedimento: 'Consulta clínica', paciente: 'Marcos Oliveira', valorApresentado: 150, valorContratado: 150 },
      { guiaId: 202611621, procedimento: 'Exame laboratorial', paciente: 'Patrícia Souza', valorApresentado: 125, valorContratado: 110 },
      { guiaId: 202611622, procedimento: 'Eletrocardiograma', paciente: 'Bruno Ferreira', valorApresentado: 80, valorContratado: 80 }
    ]
  },
  {
    id: 5004,
    ocs: 'Hospital São José',
    espelhoId: 1,
    data: '23/09/2026',
    status: 'regerada',
    podeRegerar: false,
    itens: [
      { guiaId: 202611700, procedimento: 'Consulta dermatológica', paciente: 'Camila Rodrigues', valorApresentado: 160, valorContratado: 150 },
      { guiaId: 202611701, procedimento: 'Ultrassonografia', paciente: 'Diego Martins', valorApresentado: 175, valorContratado: 175 },
      { guiaId: 202611702, procedimento: 'Consulta oftalmológica', paciente: 'Larissa Mendes', valorApresentado: 185, valorContratado: 160 }
    ]
  },
  {
    id: 5005,
    ocs: 'Hospital Regional',
    espelhoId: 2,
    data: '24/09/2026',
    status: 'gerada',
    podeRegerar: false,
    itens: [
      { guiaId: 202611800, procedimento: 'Consulta neurológica', paciente: 'Gustavo Alves', valorApresentado: 230, valorContratado: 210 },
      { guiaId: 202611801, procedimento: 'Tomografia', paciente: 'Beatriz Santos', valorApresentado: 380, valorContratado: 350 }
    ]
  }
])

function visualizarFatura(fatura) {
  faturaSelecionada.value = fatura
  modalAberto.value = true
}

function fecharDetalhes() {
  modalAberto.value = false
  faturaSelecionada.value = null
}

function regerarFatura(fatura) {
  const index = faturas.value.findIndex(item => item.id === fatura.id)

  if (index === -1) return

  faturas.value[index] = {
    ...fatura,
    status: 'regerada',
    podeRegerar: false
  }

  faturaSelecionada.value = faturas.value[index]
}
</script>

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
  .faturas-page {
    padding: 1.5rem 1rem;
  }

  .section-card {
    padding: 1rem;
  }
}
</style>