<script setup>
import { onMounted, ref } from 'vue'
import axios from 'axios'
import FaturasList from './Components/FaturasList.vue'
import BotaoEncaminhar from './Components/BotaoEncaminhar.vue'
import BotaoRegerar from './Components/BotaoRegerar.vue'
import { buscarLisuraComDivergencias } from '../../services/faturaService.js'

const faturas = ref([])
const faturaSelecionada = ref(null)
const itensAuditoria = ref([])
const carregandoAuditoria = ref(false)
const mensagemSucesso = ref('')

function mapearFatura(fatura) {
  let statusOriginal = String(fatura.status || 'ativa').toLowerCase()
  if (statusOriginal === 'em_auditoria') {
    statusOriginal = 'em auditoria'
  }

  return {
    ...fatura,
    id: fatura.id || 1,
    ocs: fatura.ocsNome || fatura.ocsId || 'Clínica Militar Exemplo',
    data: formatarData(fatura.dataGeracao || fatura.data),
    status: statusOriginal,
    espelhoId: fatura.espelhoId || 'ESP-2026/010'
  }
}

function formatarData(data) {
  if (!data) return '-'
  const dataObjeto = new Date(data)
  if (Number.isNaN(dataObjeto.getTime())) return data
  return new Intl.DateTimeFormat('pt-BR').format(dataObjeto)
}

async function carregarFaturas() {
  try {
    const response = await axios.get('http://localhost:8080/faturas')
    if (response.data && response.data.length > 0) {
      faturas.value = response.data.map(mapearFatura)
      return
    }
    throw new Error('Lista vazia')
  } catch (error) {
    const dadosMock = [
      {
        id: 1,
        fatura: "FAT-2026/001",
        espelhoId: "ESP-2026/010",
        ocs: "Clínica Militar Exemplo",
        itens: [{ valorApresentado: 175.00 }, { valorApresentado: 175.00 }],
        dataGeracao: "2026-10-15",
        status: "ativa",
        valor: 350.00
      },
      {
        id: 2,
        fatura: "FAT-2026/002",
        espelhoId: "ESP-2026/011",
        ocs: "Hospital Central FUSEx",
        itens: [{ valorApresentado: 1250.00 }],
        dataGeracao: "2026-10-18",
        status: "regerada",
        valor: 1250.00
      },
      {
        id: 3,
        fatura: "FAT-2026/003",
        espelhoId: "ESP-2026/012",
        ocs: "Instituto de Saúde do Exército",
        itens: [{ valorApresentado: 890.00 }],
        dataGeracao: "2026-10-19",
        status: "em_auditoria",
        valor: 890.00
      }
    ]
    faturas.value = dadosMock.map(mapearFatura)
  }
}

async function carregarAuditoriaLisura(faturaId) {
  carregandoAuditoria.value = true
  try {
    const resultado = await buscarLisuraComDivergencias(faturaId)
    itensAuditoria.value = resultado?.itens || []
  } catch (error) {
    itensAuditoria.value = []
  } finally {
    carregandoAuditoria.value = false
  }
}

function visualizarFatura(fatura) {
  faturaSelecionada.value = fatura
  mensagemSucesso.value = ''
  carregarAuditoriaLisura(fatura.id)
}

function voltarParaLista() {
  faturaSelecionada.value = null
  itensAuditoria.value = []
  mensagemSucesso.value = ''
}

function aoFaturaEncaminhada() {
  mensagemSucesso.value = 'Fatura encaminhada para aprovação com sucesso!'
  if (faturaSelecionada.value) {
    faturaSelecionada.value.status = 'encaminhada'
  }
}

function aoFaturaRegerada(novaFaturaMapeada) {
  const nova = mapearFatura(novaFaturaMapeada)
  faturas.value.push(nova)
  faturaSelecionada.value = nova
  mensagemSucesso.value = 'Fatura regerada com sucesso!'
}

function calcularTotal(fatura) {
  if (!fatura || !fatura.itens) return fatura?.valor || 0
  if (typeof fatura.itens[0] === 'number') return fatura.valor || 0
  return fatura.itens.reduce((total, item) => total + (Number(item.valorApresentado) || 0), 0)
}

function formatarValor(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor) || 0)
}

function obterClasseSeveridade(sev) {
  const s = String(sev || '').toUpperCase()
  if (s === 'ALTA') return 'selo-severidade-alta'
  if (s === 'MEDIA' || s === 'MÉDIA') return 'selo-severidade-media'
  return 'selo-severidade-baixa'
}

onMounted(() => {
  carregarFaturas()
})
</script>

<template>
  <div class="faturas-page">
    <div class="page-content">

      <div v-if="!faturaSelecionada">
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

      <div v-else class="detalhe-fatura-view">
        <div class="detalhe-topo">
          <button type="button" class="botao-voltar" @click="voltarParaLista">
            ← Voltar para Faturas
          </button>

          <div class="acoes-topo">
            <BotaoRegerar
              :faturaId="faturaSelecionada.id"
              :statusFatura="faturaSelecionada.status"
              @regerada="aoFaturaRegerada"
            />
            <BotaoEncaminhar
              :faturaId="faturaSelecionada.id"
              :statusFatura="faturaSelecionada.status"
              @encaminhada="aoFaturaEncaminhada"
            />
          </div>
        </div>

        <div v-if="mensagemSucesso" class="fx-alerta fx-alerta-verde" role="status">
          {{ mensagemSucesso }}
        </div>

        <div class="card-cabecalho-fatura">
          <div class="info-bloco">
            <span class="rotulo">Fatura Selecionada</span>
            <h2>FAT-{{ String(faturaSelecionada.id).padStart(3, '0') }}</h2>
          </div>
          <div class="info-bloco">
            <span class="rotulo">Prestadora (OCS)</span>
            <span class="valor-destaque">{{ faturaSelecionada.ocs }}</span>
          </div>
          <div class="info-bloco">
            <span class="rotulo">Documento de Origem</span>
            <span class="valor-destaque">Espelho Nº {{ faturaSelecionada.espelhoId }}</span>
          </div>
          <div class="info-bloco">
            <span class="rotulo">Valor Total</span>
            <span class="valor-destaque valor-moeda">{{ formatarValor(calcularTotal(faturaSelecionada)) }}</span>
          </div>
        </div>

        <div class="section-card bloco-unificado">
          <div class="cabecalho-secao-unificada">
            <h3>Detalhes e Auditoria de Lisura</h3>
            <p>Confira abaixo as informações gerais, os itens auditados com nível de severidade e o fluxo de aprovação.</p>
          </div>

          <div class="detalhes-gerais-grid">
            <div class="item-detalhe">
              <span class="rotulo-detalhe">Data de Geração</span>
              <span class="valor-detalhe">{{ faturaSelecionada.data }}</span>
            </div>
            <div class="item-detalhe">
              <span class="rotulo-detalhe">Status Atual</span>
              <span class="valor-detalhe capitalize">{{ faturaSelecionada.status }}</span>
            </div>
            <div class="item-detalhe">
              <span class="rotulo-detalhe">Total de Itens</span>
              <span class="valor-detalhe">{{ faturaSelecionada.itens?.length || 0 }} item(ns)</span>
            </div>
          </div>

          <div class="separador"></div>

          <div class="auditoria-container">
            <h4 class="subtitulo-auditoria">Itens Auditados e Divergências</h4>

            <div v-if="carregandoAuditoria" class="status-carregando">
              Carregando auditoria...
            </div>

            <div v-else-if="itensAuditoria.length === 0" class="status-vazio">
              Nenhum item encontrado para auditoria.
            </div>

            <div v-else class="tabela-wrapper">
              <table class="auditoria-table">
                <thead>
                  <tr>
                    <th>Item / Descrição</th>
                    <th>Valor Apresentado</th>
                    <th>Valor Contratado</th>
                    <th>Status Auditoria</th>
                    <th>Severidade</th>
                    <th>Motivo / Observação</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in itensAuditoria" :key="item.espelhoItemId">
                    <td>
                      <span class="item-id">#{{ item.espelhoItemId }}</span>
                      <span class="item-desc">{{ item.descricao }}</span>
                    </td>
                    <td>
                      <span class="item-valor">{{ formatarValor(item.valorApresentado) }}</span>
                    </td>
                    <td>
                      <span class="item-valor">{{ formatarValor(item.valorContratado) }}</span>
                    </td>
                    <td>
                      <span
                        class="fx-selo"
                        :class="item.autorizado ? 'fx-selo-verde' : 'fx-selo-vermelho'"
                      >
                        {{ item.autorizado ? 'Autorizado' : 'Não Autorizado' }}
                      </span>
                    </td>
                    <td>
                      <span class="selo-severidade" :class="obterClasseSeveridade(item.severidade)">
                        {{ item.severidade || 'BAIXA' }}
                      </span>
                    </td>
                    <td>
                      <span class="item-motivo">{{ item.motivo || '—' }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
.faturas-page {
  min-height: 100vh;
  padding: 2.5rem 1.5rem;
  background-color: var(--color-background, #f4f5f1);
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
  color: var(--text-color, #17201b);
  font-family: "DM Sans", sans-serif;
  font-size: 1.8rem;
  font-weight: 700;
}

.page-header p {
  margin: 0.5rem 0 0;
  color: var(--text-light-color, #55605a);
  font-size: 0.9rem;
}

.section-card {
  padding: 1.5rem;
  background-color: #ffffff;
  border: 1px solid var(--color-border, #dce0da);
  border-radius: 16px;
}

.detalhe-fatura-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detalhe-topo {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.acoes-topo {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.botao-voltar {
  padding: 0.5rem 1rem;
  border: 1px solid var(--fx-borda, #dce0da);
  border-radius: 8px;
  background-color: #ffffff;
  color: var(--fx-texto, #17201b);
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.botao-voltar:hover {
  background-color: var(--fx-verde-claro, #e5eee8);
}

.fx-alerta {
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.9rem;
  border: 1px solid transparent;
  font-weight: 500;
}

.fx-alerta-verde {
  background-color: #e5eee8;
  border-color: #b9d3c3;
  color: #1e4d36;
}

.card-cabecalho-fatura {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background-color: #ffffff;
  border: 1px solid var(--fx-borda, #dce0da);
  border-radius: 14px;
}

.info-bloco {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.rotulo {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--fx-texto-suave, #55605a);
  font-weight: 600;
}

.valor-destaque {
  font-size: 1rem;
  font-weight: 600;
  color: var(--fx-texto, #17201b);
}

.valor-moeda {
  font-family: var(--fx-fonte-mono, monospace);
  color: var(--fx-verde, #1e4d36);
}

.bloco-unificado {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.cabecalho-secao-unificada h3 {
  margin: 0;
  font-size: 1.15rem;
  color: var(--fx-texto, #17201b);
}

.cabecalho-secao-unificada p {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: var(--fx-texto-suave, #55605a);
}

.detalhes-gerais-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  background-color: #f8faf9;
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid var(--fx-borda, #dce0da);
}

.item-detalhe {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.rotulo-detalhe {
  font-size: 0.75rem;
  color: var(--fx-texto-suave, #55605a);
  font-weight: 500;
}

.valor-detalhe {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--fx-texto, #17201b);
}

.capitalize {
  text-transform: capitalize;
}

.separador {
  height: 1px;
  background-color: var(--fx-borda, #dce0da);
  width: 100%;
}

.subtitulo-auditoria {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  color: var(--fx-texto, #17201b);
}

.tabela-wrapper {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--fx-borda, #dce0da);
  border-radius: 10px;
}

.auditoria-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.auditoria-table th {
  background-color: var(--fx-verde-claro, #e5eee8);
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--fx-verde, #1e4d36);
  white-space: nowrap;
}

.auditoria-table td {
  padding: 0.85rem 1rem;
  border-top: 1px solid var(--fx-borda, #dce0da);
  font-size: 0.85rem;
  color: var(--fx-texto, #17201b);
  vertical-align: middle;
}

.item-id {
  font-family: var(--fx-fonte-mono, monospace);
  font-weight: 600;
  color: var(--fx-verde, #1e4d36);
  display: block;
}

.item-desc {
  color: var(--fx-texto-suave, #55605a);
  font-size: 0.8rem;
}

.item-valor {
  font-family: var(--fx-fonte-mono, monospace);
  white-space: nowrap;
}

.item-motivo {
  color: var(--fx-texto-suave, #55605a);
  font-size: 0.82rem;
}

.fx-selo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.65rem;
  border-radius: 12px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.fx-selo-verde {
  background-color: #e5eee8;
  color: #1e4d36;
  border: 1px solid #b9d3c3;
}

.fx-selo-vermelho {
  background-color: #fbe7e4;
  color: #a3261b;
  border: 1px solid #f0c4be;
}

.selo-severidade {
  display: inline-flex;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
}

.selo-severidade-alta {
  background-color: #fde8e8;
  color: #9b1c1c;
}

.selo-severidade-media {
  background-color: #fef3c7;
  color: #92400e;
}

.selo-severidade-baixa {
  background-color: #e5e7eb;
  color: #374151;
}

.status-carregando,
.status-vazio {
  padding: 1.5rem;
  text-align: center;
  color: var(--fx-texto-suave, #55605a);
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .faturas-page {
    padding: 1.5rem 1rem;
  }
}
</style>