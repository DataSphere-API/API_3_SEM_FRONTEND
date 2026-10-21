<script setup>
import { ref, onMounted } from 'vue'
import OcsFormulario from './components/OcsFormulario.vue'
import { listarOcs } from '../../services/ocsService.js'
import { formatarCnpj } from '../../utils/documentos.js'

const ocs = ref([])
const carregando = ref(false)
const erro = ref('')
const aviso = ref('')
const formularioAberto = ref(false)
const ocsEditada = ref(null)

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    ocs.value = await listarOcs()
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível carregar as OCS.'
  } finally {
    carregando.value = false
  }
}

function abrirFormulario(item = null) {
  aviso.value = ''
  ocsEditada.value = item
  formularioAberto.value = true
}

function aoSalvar(item) {
  aviso.value = `${item.nomeFantasia} salva com sucesso.`
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
          <h1 class="fx-titulo">OCS credenciadas</h1>
          <p class="fx-subtitulo">Clínicas, hospitais e profissionais que atendem pelo FUSEx.</p>
        </div>
        <button type="button" class="fx-botao" @click="abrirFormulario()">Cadastrar OCS</button>
      </header>

      <p v-if="aviso" class="fx-alerta fx-alerta-verde" role="status">{{ aviso }}</p>
      <p v-if="carregando" class="fx-alerta fx-alerta-cinza">Carregando OCS...</p>
      <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>

      <div v-if="!carregando && !erro" class="fx-tabela-rolagem">
        <table class="fx-tabela">
          <thead>
            <tr>
              <th>OCS</th>
              <th>CNPJ</th>
              <th>Serviço</th>
              <th>Situação</th>
              <th><span class="fx-suave">Ação</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in ocs" :key="o.cnpj">
              <td>
                <strong>{{ o.nomeFantasia }}</strong>
                <div class="fx-suave">{{ o.nome }}</div>
              </td>
              <td class="fx-mono">{{ formatarCnpj(o.cnpj) }}</td>
              <td>{{ o.tipoServico || '—' }}</td>
              <td>
                <span class="fx-selo" :class="o.ativa ? 'fx-selo-verde' : 'fx-selo-vermelho'">
                  {{ o.ativa ? 'Ativa' : 'Inativa' }}
                </span>
              </td>
              <td>
                <button type="button" class="fx-botao-secundario" @click="abrirFormulario(o)">Editar</button>
              </td>
            </tr>
            <tr v-if="ocs.length === 0">
              <td colspan="5" class="fx-suave">Nenhuma OCS cadastrada.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <OcsFormulario
      v-if="formularioAberto"
      :ocs="ocsEditada"
      @fechar="formularioAberto = false"
      @salvo="aoSalvar"
    />
  </main>
</template>
