<script setup>
import { ref, computed, onMounted } from 'vue'
import ContratoFormulario from './components/ContratoFormulario.vue'
import { listarContratos, listarProcedimentos } from '../../services/contratoService.js'
import { listarOcs } from '../../services/ocsService.js'
import { formatarMoeda } from '../../utils/avaliarLisura.js'
import { formatarData } from '../../utils/documentos.js'

const contratos = ref([])
const ocs = ref([])
const procedimentos = ref([])
const carregando = ref(false)
const erro = ref('')
const aviso = ref('')
const filtroOcs = ref('')
const formularioAberto = ref(false)
const contratoEditado = ref(null)

const hoje = new Date().toISOString().slice(0, 10)

const contratosFiltrados = computed(() =>
  filtroOcs.value ? contratos.value.filter(c => c.ocsCnpj === filtroOcs.value) : contratos.value
)

function situacao(contrato) {
  if (contrato.fimVigencia < hoje) return { texto: 'Vencido', classe: 'fx-selo-vermelho' }
  if (contrato.inicioVigencia > hoje) return { texto: 'Futuro', classe: 'fx-selo-azul' }
  return { texto: 'Vigente', classe: 'fx-selo-verde' }
}

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

function abrirFormulario(contrato = null) {
  aviso.value = ''
  contratoEditado.value = contrato
  formularioAberto.value = true
}

function aoSalvar(contrato) {
  aviso.value = `Contrato ${contrato.numero} salvo com sucesso.`
  formularioAberto.value = false
  carregar()
}

onMounted(carregar)
</script>

<template>
  <main class="fx-pagina">
    <div class="fx-conteudo fx-conteudo-largo">
      <header class="fx-topo-pagina">
        <div>
          <h1 class="fx-titulo">Contratos</h1>
          <p class="fx-subtitulo">
            Valor de cada procedimento por OCS. Só procedimentos com contrato vigente entram numa pré-guia.
          </p>
        </div>
        <button type="button" class="fx-botao" @click="abrirFormulario()">Novo contrato</button>
      </header>

      <label class="fx-campo filtro">
        OCS
        <select v-model="filtroOcs" class="fx-entrada">
          <option value="">Todas</option>
          <option v-for="o in ocs" :key="o.cnpj" :value="o.cnpj">{{ o.nomeFantasia }}</option>
        </select>
      </label>

      <p v-if="aviso" class="fx-alerta fx-alerta-verde" role="status">{{ aviso }}</p>
      <p v-if="carregando" class="fx-alerta fx-alerta-cinza">Carregando contratos...</p>
      <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>

      <div v-if="!carregando && !erro" class="fx-tabela-rolagem">
        <table class="fx-tabela">
          <thead>
            <tr>
              <th>Contrato</th>
              <th>OCS</th>
              <th>Procedimento</th>
              <th>Valor</th>
              <th>Vigência</th>
              <th><span class="fx-suave">Ação</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in contratosFiltrados" :key="c.id">
              <td class="fx-mono">{{ c.numero }}</td>
              <td>{{ c.ocsNome }}</td>
              <td>{{ c.procedimentoNome }}</td>
              <td class="fx-mono">{{ formatarMoeda(c.valor) }}</td>
              <td>
                {{ formatarData(c.inicioVigencia) }} a {{ formatarData(c.fimVigencia) }}
                <span class="fx-selo" :class="situacao(c).classe">{{ situacao(c).texto }}</span>
              </td>
              <td>
                <button type="button" class="fx-botao-secundario" @click="abrirFormulario(c)">Editar</button>
              </td>
            </tr>
            <tr v-if="contratosFiltrados.length === 0">
              <td colspan="6" class="fx-suave">Nenhum contrato encontrado.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ContratoFormulario
      v-if="formularioAberto"
      :contrato="contratoEditado"
      :ocs="ocs"
      :procedimentos="procedimentos"
      @fechar="formularioAberto = false"
      @salvo="aoSalvar"
    />
  </main>
</template>

<style scoped>
.filtro {
  max-width: 320px;
}
</style>
