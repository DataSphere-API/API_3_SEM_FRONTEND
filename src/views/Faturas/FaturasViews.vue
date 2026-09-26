<template>
  <div class="faturas-page">
    <main class="page-content">
      <header class="page-header">
        <div>
          <h1>Faturas</h1>
          <p>Consulte as faturas geradas a partir dos espelhos e realize auditorias.</p>
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
    status: 'com_divergencia',
    itens: [
      { guiaId: 202611463, procedimento: 'Consulta médica', paciente: 'João da Silva', valorApresentado: 180, valorContratado: 160 },
      { guiaId: 202611464, procedimento: 'Exame de imagem', paciente: 'Maria Oliveira', valorApresentado: 320, valorContratado: 320 }
    ]
  },
  {
    id: 5002,
    ocs: 'Santa Casa',
    espelhoId: 1,
    data: '21/09/2026',
    status: 'encaminhada',
    itens: [
      { guiaId: 202611520, procedimento: 'Consulta ortopédica', paciente: 'Pedro Santos', valorApresentado: 190, valorContratado: 180 }
    ]
  },
  {
    id: 5003,
    ocs: 'Hospital Municipal',
    espelhoId: 1,
    data: '22/09/2026',
    status: 'pendente_auditoria',
    itens: [
      { guiaId: 202611620, procedimento: 'Consulta clínica', paciente: 'Marcos Oliveira', valorApresentado: 150, valorContratado: 150 }
    ]
  },
  {
    id: 5004,
    ocs: 'Hospital São José',
    espelhoId: 2,
    data: '23/09/2026',
    status: 'com_divergencia',
    itens: [
      { guiaId: 202611700, procedimento: 'Consulta dermatológica', paciente: 'Camila Rodrigues', valorApresentado: 160, valorContratado: 150 },
      { guiaId: 202611701, procedimento: 'Ultrassonografia', paciente: 'Diego Martins', valorApresentado: 175, valorContratado: 175 }
    ]
  },
  {
    id: 5005,
    ocs: 'Clinica Cardiológica São Luiz',
    espelhoId: 3,
    data: '24/09/2026',
    status: 'aprovada',
    itens: [
      { guiaId: 202611800, procedimento: 'Eletrocardiograma', paciente: 'Lucia Ferraz', valorApresentado: 110, valorContratado: 110 },
      { guiaId: 202611801, procedimento: 'Ecocardiograma', paciente: 'Roberto Souza', valorApresentado: 250, valorContratado: 250 }
    ]
  },
  {
    id: 5006,
    ocs: 'Laboratório Central',
    espelhoId: 3,
    data: '25/09/2026',
    status: 'pendente_auditoria',
    itens: [
      { guiaId: 202611900, procedimento: 'Hemograma Completo', paciente: 'Fernanda Lima', valorApresentado: 45, valorContratado: 45 },
      { guiaId: 202611901, procedimento: 'Glicemia em Jejum', paciente: 'Gabriel Rocha', valorApresentado: 30, valorContratado: 30 }
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
    status: 'pendente_auditoria'
  }

  faturaSelecionada.value = faturas.value[index]
}
</script>

<style scoped>
.faturas-page {
  min-height: 100vh;
  padding: 2.5rem 1.5rem;
  background-color: var(--color-background, #f9fafb);
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
  color: var(--text-color, #111827);
  font-family: "DM Sans", sans-serif;
  font-size: 1.8rem;
  font-weight: 700;
}

.page-header p {
  margin: 0.5rem 0 0;
  color: var(--text-light-color, #6b7280);
  font-size: 0.9rem;
}

.section-card {
  padding: 1.5rem;
  background-color: #ffffff;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0, 0.04);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  margin: 0;
  color: var(--text-color, #111827);
  font-family: "DM Sans", sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
}

.section-header p {
  margin: 0.35rem 0 0;
  color: var(--text-light-color, #6b7280);
  font-size: 0.85rem;
}
</style>