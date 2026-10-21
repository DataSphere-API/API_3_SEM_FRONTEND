<script setup>
import { formatarMoeda } from '../utils/avaliarLisura.js'
import { formatarDataHora } from '../utils/documentos.js'
import { CARATER, seloDecisao, seloStatus } from '../utils/fluxoPreGuia.js'

defineProps({
  preGuia: { type: Object, required: true }
})
</script>

<template>
  <section class="resumo">
    <div class="topo">
      <div>
        <h2 class="fx-mono numero">{{ preGuia.numero }}</h2>
        <p class="fx-suave">
          Criada em {{ formatarDataHora(preGuia.criadaEm) }} por {{ preGuia.criadaPor?.nome }}
        </p>
      </div>
      <span class="fx-selo" :class="seloStatus(preGuia.status).classe">{{ seloStatus(preGuia.status).texto }}</span>
    </div>

    <dl class="dados">
      <div>
        <dt>Beneficiário</dt>
        <dd>{{ preGuia.beneficiario.nome }} <span class="fx-suave fx-mono">· Prec-CP {{ preGuia.beneficiario.precCp }}</span></dd>
      </div>
      <div>
        <dt>Médico solicitante</dt>
        <dd>{{ preGuia.medicoSolicitante.nome }} <span class="fx-suave fx-mono">· CRM {{ preGuia.medicoSolicitante.crm }}/{{ preGuia.medicoSolicitante.uf }}</span></dd>
      </div>
      <div>
        <dt>CID-10</dt>
        <dd class="fx-mono">{{ preGuia.cid || 'Não informado' }}</dd>
      </div>
      <div>
        <dt>Caráter</dt>
        <dd>{{ CARATER[preGuia.carater] || preGuia.carater }}</dd>
      </div>
      <div class="largo">
        <dt>Justificativa clínica</dt>
        <dd>{{ preGuia.justificativa }}</dd>
      </div>
      <div v-if="preGuia.observacoesEmissor" class="largo">
        <dt>Observações do emissor</dt>
        <dd>{{ preGuia.observacoesEmissor }}</dd>
      </div>
      <div v-if="preGuia.respostaEmissor" class="largo">
        <dt>Resposta do emissor à devolução</dt>
        <dd>{{ preGuia.respostaEmissor }}</dd>
      </div>
    </dl>

    <div class="fx-tabela-rolagem">
      <table class="fx-tabela">
        <thead>
          <tr>
            <th>Procedimento</th>
            <th>OCS</th>
            <th>Qtde</th>
            <th>Valor unit.</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in preGuia.procedimentos" :key="`${p.procedimentoId}-${p.ocs.cnpj}`">
            <td>{{ p.nome }}</td>
            <td>{{ p.ocs.nome }}</td>
            <td class="fx-mono">{{ p.quantidade }}</td>
            <td class="fx-mono">{{ formatarMoeda(p.valorUnitario) }}</td>
            <td class="fx-mono">{{ formatarMoeda(p.valorTotal) }}</td>
          </tr>
          <tr>
            <td colspan="4"><strong>Valor total</strong></td>
            <td class="fx-mono"><strong>{{ formatarMoeda(preGuia.valorTotal) }}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="decisoes">
      <div
        v-for="item in [
          { quem: 'Médico', ...preGuia.aprovacaoMedico },
          { quem: 'Chefe do FUSEx', ...preGuia.aprovacaoChefe }
        ]"
        :key="item.quem"
        class="decisao"
      >
        <div class="decisao-topo">
          <strong>{{ item.quem }}</strong>
          <span class="fx-selo" :class="seloDecisao(item.decisao).classe">{{ seloDecisao(item.decisao).texto }}</span>
        </div>
        <p v-if="item.por" class="fx-suave">{{ item.por }} · {{ formatarDataHora(item.data) }}</p>
        <p v-if="item.observacao" class="observacao">“{{ item.observacao }}”</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.resumo {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.topo {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}

.numero {
  margin: 0;
  font-size: 1.15rem;
}

.topo p {
  margin: 0.2rem 0 0;
}

.dados {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem 1.25rem;
}

.dados .largo {
  grid-column: 1 / -1;
}

.dados dt {
  font-size: 0.8rem;
  color: var(--fx-texto-suave);
}

.dados dd {
  margin: 0.2rem 0 0;
  line-height: 1.45;
}

.decisoes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.decisao {
  flex: 1 1 240px;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--fx-borda);
  border-radius: 10px;
  background-color: #fafbf8;
}

.decisao-topo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.decisao p {
  margin: 0.4rem 0 0;
}

.observacao {
  font-size: 0.9rem;
  line-height: 1.4;
}
</style>
