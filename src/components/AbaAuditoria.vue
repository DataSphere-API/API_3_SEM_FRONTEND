<template>
  <div class="container-auditoria">
    <h3>Visão do Auditor - Painel de Auditoria da Fatura</h3>

    <!-- 1. Tabela de Comparação de Lisura (Itens Autorizados na Guia) -->
    <div class="card-auditoria">
      <h4>Comparativo de Lisura (Guia x Espelho)</h4>
      <table class="tabela-auditoria">
        <thead>
          <tr>
            <th>Procedimento</th>
            <th>Autorizado na Guia</th>
            <th>Valor Guia</th>
            <th>Valor Cobrado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in lisura" :key="item.itemId">
            <td>{{ item.procedimento }}</td>
            <td>
              <span :class="['tag-autorizacao', item.autorizadoNaGuia ? 'sim' : 'nao']">
                {{ item.autorizadoNaGuia ? 'SIM' : 'NÃO' }}
              </span>
            </td>
            <td>R$ {{ item.valorGuia.toFixed(2) }}</td>
            <td>R$ {{ item.valorCobrado.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 2. Tabela de Divergências Consolidadas com Severidade -->
    <div class="card-auditoria">
      <h4>Divergências Consolidadas</h4>
      <table class="tabela-auditoria">
        <thead>
          <tr>
            <th>Item / Procedimento</th>
            <th>Descrição da Divergência</th>
            <th>Severidade</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in divergencias" :key="item.itemId">
            <td>{{ item.procedimento }}</td>
            <td>{{ item.descricaoDivergencia }}</td>
            <td>
              <span :class="['badge-severidade', item.severidade.toLowerCase()]">
                {{ item.severidade }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 3. Botão de Encaminhamento -->
    <div class="acoes-auditoria">
      <button class="btn-encaminhar" @click="encaminharParaAprovacao">
        Encaminhar Fatura para Aprovação
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  faturaId: {
    type: [Number, String],
    default: 1
  }
});

// Mock da Lisura (GET /faturas/{id}/lisura)
const lisura = ref([
  { itemId: 1, procedimento: 'Consulta Médica em PA', autorizadoNaGuia: true, valorGuia: 150.00, valorCobrado: 150.00 },
  { itemId: 2, procedimento: 'Exame Ultrassonografia', autorizadoNaGuia: false, valorGuia: 0.00, valorCobrado: 250.00 },
  { itemId: 3, procedimento: 'Hemograma Completo', autorizadoNaGuia: true, valorGuia: 45.00, valorCobrado: 55.00 }
]);

// Mock das Divergências com Severidade (GET /faturas/{id}/divergencias)
const divergencias = ref([
  { itemId: 2, procedimento: 'Exame Ultrassonografia', descricaoDivergencia: 'Procedimento realizado sem autorização prévia na guia', severidade: 'ALTA' },
  { itemId: 3, procedimento: 'Hemograma Completo', descricaoDivergencia: 'Valor cobrado acima do valor acordado em contrato', severidade: 'MEDIA' }
]);

// Ação para Encaminhar (POST /faturas/{id}/encaminhar)
const encaminharParaAprovacao = () => {
  alert(`Fatura #${props.faturaId} encaminhada com sucesso para a etapa de aprovação!`);
};
</script>

<style scoped>
.container-auditoria {
  padding: 16px;
  background-color: #ffffff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-auditoria {
  background-color: #fafafa;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}

.card-auditoria h4 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #333;
}

.tabela-auditoria {
  width: 100%;
  border-collapse: collapse;
  background-color: #fff;
}

.tabela-auditoria th,
.tabela-auditoria td {
  border: 1px solid #e0e0e0;
  padding: 10px;
  text-align: left;
}

.tabela-auditoria th {
  background-color: #f5f5f5;
  font-weight: bold;
}

/* Tag de Autorização */
.tag-autorizacao {
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 11px;
}
.tag-autorizacao.sim { background-color: #e6f7ff; color: #1890ff; border: 1px solid #91d5ff; }
.tag-autorizacao.nao { background-color: #fff2f0; color: #ff4d4f; border: 1px solid #ffccc7; }

/* Badges de Severidade */
.badge-severidade {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  color: #fff;
}

.badge-severidade.alta { background-color: #ff4d4f; }
.badge-severidade.media { background-color: #faad14; }
.badge-severidade.baixa { background-color: #52c41a; }

/* Botão */
.acoes-auditoria {
  display: flex;
  justify-content: flex-end;
}

.btn-encaminhar {
  background-color: #1890ff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-encaminhar:hover {
  background-color: #40a9ff;
}
</style>