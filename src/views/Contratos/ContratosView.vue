<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { listarContratos, criarContrato, listarProcedimentos, criarProcedimento } from '../../services/contratoService.js'
import { listarOcs } from '../../services/ocsService.js'
import { formatarMoeda } from '../../utils/avaliarLisura.js'

const contratos = ref([])
const ocs = ref([])
const procedimentos = ref([])
const carregando = ref(false)
const erro = ref('')
const aviso = ref('')
const erroForm = ref('')
const errosCampo = ref({})
const salvando = ref(false)
const filtroOcs = ref('')
const form = reactive({ ocsCnpj: '', procedimentoId: '', valor: '' })
const novoProcedimento = ref('')
const erroProcedimento = ref('')
const salvandoProcedimento = ref(false)

const contratosFiltrados = computed(() =>
  filtroOcs.value ? contratos.value.filter(c => c.ocsCnpj === filtroOcs.value) : contratos.value
)

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    const [listaContratos, listaOcs, listaProcedimentos] = await Promise.all([
      listarContratos(),
      listarOcs(),
      listarProcedimentos()
    ])
    contratos.value = listaContratos
    ocs.value = listaOcs
    procedimentos.value = listaProcedimentos
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível carregar os contratos.'
  } finally {
    carregando.value = false
  }
}

async function cadastrar() {
  aviso.value = ''
  erroForm.value = ''
  const erros = {}
  if (!form.ocsCnpj) erros.ocsCnpj = 'Escolha a OCS.'
  if (!form.procedimentoId) erros.procedimentoId = 'Escolha o procedimento.'
  if (!(Number(form.valor) > 0)) erros.valor = 'O valor precisa ser maior que zero.'
  errosCampo.value = erros
  if (Object.keys(erros).length) return

  salvando.value = true
  try {
    const novo = await criarContrato({
      ocsCnpj: form.ocsCnpj,
      procedimentoId: Number(form.procedimentoId),
      valor: Number(form.valor)
    })
    aviso.value = `Contrato de ${novo.procedimentoNome} com ${novo.ocsNome} cadastrado.`
    form.procedimentoId = ''
    form.valor = ''
    await carregar()
  } catch (e) {
    erroForm.value = e.mensagemUsuario || 'Não foi possível cadastrar o contrato.'
  } finally {
    salvando.value = false
  }
}

async function cadastrarProcedimento() {
  aviso.value = ''
  erroProcedimento.value = ''
  if (!novoProcedimento.value.trim()) {
    erroProcedimento.value = 'Informe o nome do procedimento.'
    return
  }
  salvandoProcedimento.value = true
  try {
    const procedimento = await criarProcedimento({ nome: novoProcedimento.value.trim() })
    procedimentos.value = await listarProcedimentos()
    form.procedimentoId = procedimento.id
    novoProcedimento.value = ''
    aviso.value = `Procedimento ${procedimento.nome} cadastrado. Agora informe a OCS e o valor do contrato.`
  } catch (e) {
    erroProcedimento.value = e.mensagemUsuario || 'Não foi possível cadastrar o procedimento.'
  } finally {
    salvandoProcedimento.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <main class="fx-pagina">
    <div class="fx-conteudo">
      <header>
        <h1 class="fx-titulo">Contratos</h1>
        <p class="fx-subtitulo">
          Quanto o FUSEx paga por procedimento em cada OCS. Só procedimentos com contrato entram numa pré-guia.
        </p>
      </header>

      <form class="fx-cartao" novalidate @submit.prevent="cadastrarProcedimento">
        <h2 class="fx-secao-titulo">Novo procedimento</h2>
        <p class="fx-suave">Cadastre aqui o exame ou procedimento que ainda não aparece na lista do contrato.</p>
        <p v-if="erroProcedimento" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erroProcedimento }}</p>
        <div class="linha-procedimento">
          <label class="fx-campo">
            Nome do procedimento
            <input v-model="novoProcedimento" class="fx-entrada" placeholder="Ex.: Ressonância magnética · joelho" />
          </label>
          <button type="submit" class="fx-botao-secundario" :disabled="salvandoProcedimento">
            {{ salvandoProcedimento ? 'Salvando...' : 'Cadastrar procedimento' }}
          </button>
        </div>
      </form>

      <form class="fx-cartao" novalidate @submit.prevent="cadastrar">
        <h2 class="fx-secao-titulo">Novo contrato</h2>
        <p v-if="erroForm" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erroForm }}</p>
        <div class="fx-grade">
          <label class="fx-campo">
            OCS
            <select v-model="form.ocsCnpj" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.ocsCnpj }">
              <option value="" disabled>Escolha a OCS</option>
              <option v-for="o in ocs" :key="o.cnpj" :value="o.cnpj">{{ o.nome }}</option>
            </select>
            <span v-if="errosCampo.ocsCnpj" class="fx-erro-campo">{{ errosCampo.ocsCnpj }}</span>
          </label>
          <label class="fx-campo">
            Procedimento
            <select v-model="form.procedimentoId" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.procedimentoId }">
              <option value="" disabled>Escolha o procedimento</option>
              <option v-for="p in procedimentos" :key="p.id" :value="p.id">{{ p.nome }}</option>
            </select>
            <span v-if="errosCampo.procedimentoId" class="fx-erro-campo">{{ errosCampo.procedimentoId }}</span>
          </label>
          <label class="fx-campo campo-valor">
            Valor (R$)
            <input v-model="form.valor" type="number" min="0.01" step="0.01" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.valor }" />
            <span v-if="errosCampo.valor" class="fx-erro-campo">{{ errosCampo.valor }}</span>
          </label>
        </div>
        <div>
          <button type="submit" class="fx-botao" :disabled="salvando">{{ salvando ? 'Salvando...' : 'Cadastrar' }}</button>
        </div>
      </form>

      <p v-if="aviso" class="fx-alerta fx-alerta-verde" role="status">{{ aviso }}</p>

      <label class="fx-campo filtro">
        Filtrar por OCS
        <select v-model="filtroOcs" class="fx-entrada">
          <option value="">Todas</option>
          <option v-for="o in ocs" :key="o.cnpj" :value="o.cnpj">{{ o.nome }}</option>
        </select>
      </label>

      <p v-if="carregando" class="fx-alerta fx-alerta-cinza">Carregando contratos...</p>
      <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>

      <div v-if="!carregando && !erro" class="fx-tabela-rolagem">
        <table class="fx-tabela">
          <thead>
            <tr>
              <th>OCS</th>
              <th>Procedimento</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in contratosFiltrados" :key="c.id">
              <td>{{ c.ocsNome }}</td>
              <td>{{ c.procedimentoNome }}</td>
              <td class="fx-mono">{{ formatarMoeda(c.valor) }}</td>
            </tr>
            <tr v-if="contratosFiltrados.length === 0">
              <td colspan="3" class="fx-suave">Nenhum contrato encontrado.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>

<style scoped>
.campo-valor {
  flex: 0 1 160px;
  min-width: 140px;
}

.filtro {
  max-width: 320px;
}

.linha-procedimento {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.75rem;
}
</style>
