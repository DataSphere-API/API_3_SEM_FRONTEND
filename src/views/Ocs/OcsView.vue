<script setup>
import { reactive, ref, onMounted } from 'vue'
import { listarOcs, criarOcs } from '../../services/ocsService.js'
import { formatarCnpj, somenteDigitos } from '../../utils/documentos.js'

const ocs = ref([])
const carregando = ref(false)
const erro = ref('')
const aviso = ref('')
const erroForm = ref('')
const errosCampo = ref({})
const salvando = ref(false)
const form = reactive({ cnpj: '', nome: '' })

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

async function cadastrar() {
  aviso.value = ''
  erroForm.value = ''
  const erros = {}
  if (somenteDigitos(form.cnpj).length !== 14) erros.cnpj = 'O CNPJ tem 14 dígitos.'
  if (!form.nome.trim()) erros.nome = 'Informe o nome.'
  errosCampo.value = erros
  if (Object.keys(erros).length) return

  salvando.value = true
  try {
    const nova = await criarOcs({ cnpj: somenteDigitos(form.cnpj), nome: form.nome.trim() })
    aviso.value = `${nova.nome} cadastrada.`
    form.cnpj = ''
    form.nome = ''
    await carregar()
  } catch (e) {
    erroForm.value = e.mensagemUsuario || 'Não foi possível cadastrar a OCS.'
  } finally {
    salvando.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <main class="fx-pagina">
    <div class="fx-conteudo">
      <header>
        <h1 class="fx-titulo">OCS credenciadas</h1>
        <p class="fx-subtitulo">Clínicas, hospitais e profissionais que atendem pelo FUSEx. Os valores ficam em Contratos.</p>
      </header>

      <form class="fx-cartao" novalidate @submit.prevent="cadastrar">
        <h2 class="fx-secao-titulo">Cadastrar OCS</h2>
        <p v-if="erroForm" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erroForm }}</p>
        <div class="fx-grade">
          <label class="fx-campo">
            CNPJ
            <input
              :value="form.cnpj"
              class="fx-entrada"
              :class="{ 'fx-entrada-erro': errosCampo.cnpj }"
              inputmode="numeric"
              placeholder="00.000.000/0000-00"
              @input="form.cnpj = formatarCnpj($event.target.value)"
            />
            <span v-if="errosCampo.cnpj" class="fx-erro-campo">{{ errosCampo.cnpj }}</span>
          </label>
          <label class="fx-campo">
            Nome
            <input v-model="form.nome" class="fx-entrada" :class="{ 'fx-entrada-erro': errosCampo.nome }" />
            <span v-if="errosCampo.nome" class="fx-erro-campo">{{ errosCampo.nome }}</span>
          </label>
        </div>
        <div>
          <button type="submit" class="fx-botao" :disabled="salvando">{{ salvando ? 'Salvando...' : 'Cadastrar' }}</button>
        </div>
      </form>

      <p v-if="aviso" class="fx-alerta fx-alerta-verde" role="status">{{ aviso }}</p>
      <p v-if="carregando" class="fx-alerta fx-alerta-cinza">Carregando OCS...</p>
      <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>

      <div v-if="!carregando && !erro" class="fx-tabela-rolagem">
        <table class="fx-tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>CNPJ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in ocs" :key="o.cnpj">
              <td><strong>{{ o.nome }}</strong></td>
              <td class="fx-mono">{{ formatarCnpj(o.cnpj) }}</td>
            </tr>
            <tr v-if="ocs.length === 0">
              <td colspan="2" class="fx-suave">Nenhuma OCS cadastrada.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>
