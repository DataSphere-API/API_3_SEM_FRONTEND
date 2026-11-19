<script setup>
import { formatarMoeda } from '../utils/avaliarLisura.js'
import { formatarData, formatarDataHora } from '../utils/documentos.js'
import { cargoDaAssinatura, numeroPreGuia, seloStatus } from '../utils/fluxoPreGuia.js'

defineProps({
  preGuia: { type: Object, required: true }
})
</script>

<template>
  <section class="resumo">
    <div class="topo">
      <div>
        <h2 class="fx-mono numero">{{ numeroPreGuia(preGuia.id) }}</h2>
        <p class="fx-suave">Criada em {{ formatarData(preGuia.dataCriacao) }}</p>
      </div>
      <span class="fx-selo" :class="seloStatus(preGuia.status).classe">{{ seloStatus(preGuia.status).texto }}</span>
    </div>

    <dl class="dados">
      <div>
        <dt>Beneficiário</dt>
        <dd>{{ preGuia.beneficiario.nome }} <span class="fx-suave fx-mono">· Prec-CP {{ preGuia.beneficiario.precCp }}</span></dd>
      </div>
      <div>
        <dt>Médico responsável</dt>
        <dd>{{ preGuia.medico.nome }} <span class="fx-suave fx-mono">· CRM {{ preGuia.medico.crm || '—' }}</span></dd>
      </div>
      <div v-if="preGuia.dataEmissao">
        <dt>Emissão</dt>
        <dd>{{ formatarData(preGuia.dataEmissao) }} · válida até {{ formatarData(preGuia.validoAte) }}</dd>
      </div>
    </dl>

    <p v-if="preGuia.status === 'REPROVADA'" class="fx-alerta fx-alerta-vermelho">
      <strong>Reprovada:</strong> {{ preGuia.motivoReprovacao }}
    </p>

    <div v-if="preGuia.validacao?.pendencias?.length" class="fx-alerta fx-alerta-vermelho">
      <strong>Pendências da validação</strong>
      <ul class="pendencias">
        <li v-for="(p, i) in preGuia.validacao.pendencias" :key="i">{{ p.mensagem }}</li>
      </ul>
    </div>

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
          <tr v-for="p in preGuia.procedimentos" :key="p.atendimentoId">
            <td>{{ p.nome }}</td>
            <td>{{ p.ocs.nome }}</td>
            <td class="fx-mono">{{ p.qtdSessoes }}</td>
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

    <div v-if="preGuia.assinatura" class="assinatura">
      <strong>{{ preGuia.status === 'REPROVADA' ? 'Reprovada por' : 'Aprovada por' }}</strong>
      <span>
        {{ preGuia.assinatura.nome }} · {{ cargoDaAssinatura(preGuia.assinatura.perfil) }}
        <span class="fx-suave fx-mono"> · usuário {{ preGuia.assinatura.usuarioId }} · {{ formatarDataHora(preGuia.assinatura.dataHora) }}</span>
      </span>
    </div>
    <p v-else-if="preGuia.status === 'VALIDADA'" class="fx-alerta fx-alerta-ambar">
      Aguardando a aprovação do médico responsável ou do Chefe do FUSEx. Basta uma das duas.
    </p>
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

.dados dt {
  font-size: 0.8rem;
  color: var(--fx-texto-suave);
}

.dados dd {
  margin: 0.2rem 0 0;
  line-height: 1.45;
}

.pendencias {
  margin: 0.4rem 0 0;
  padding-left: 1.2rem;
}

.assinatura {
  padding: 0.75rem 0.9rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid var(--fx-borda);
  border-radius: 10px;
  background-color: #fafbf8;
}
</style>
