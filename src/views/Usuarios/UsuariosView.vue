<script setup>
import { ref, computed, onMounted } from 'vue'
import UsuarioFormulario from './components/UsuarioFormulario.vue'
import { listarUsuarios } from '../../services/usuarioService.js'
import { listarOcs } from '../../services/ocsService.js'
import { rotuloPerfil } from '../../utils/perfis.js'
import { formatarCpf, somenteDigitos } from '../../utils/documentos.js'

const usuarios = ref([])
const ocs = ref([])
const carregando = ref(false)
const erro = ref('')
const aviso = ref('')
const busca = ref('')
const formularioAberto = ref(false)
const usuarioEditado = ref(null)

const usuariosFiltrados = computed(() => {
  const termo = busca.value.trim().toLowerCase()
  if (!termo) return usuarios.value
  return usuarios.value.filter(
    u => u.nome.toLowerCase().includes(termo) || (somenteDigitos(termo) && u.cpf.includes(somenteDigitos(termo)))
  )
})

function nomeOcs(cnpj) {
  return ocs.value.find(o => o.cnpj === cnpj)?.nomeFantasia || ''
}

function vinculo(usuario) {
  const partes = []
  if (usuario.crm) partes.push(`CRM ${usuario.crm}/${usuario.crmUf}`)
  if (usuario.ocsCnpj) partes.push(nomeOcs(usuario.ocsCnpj))
  if (usuario.precCp) partes.push(`Prec-CP ${usuario.precCp}`)
  return partes.join(' · ') || '—'
}

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    const [listaUsuarios, listaOcs] = await Promise.all([listarUsuarios(), listarOcs()])
    usuarios.value = listaUsuarios
    ocs.value = listaOcs
  } catch (e) {
    erro.value = e.mensagemUsuario || 'Não foi possível carregar os usuários.'
  } finally {
    carregando.value = false
  }
}

function abrirFormulario(usuario = null) {
  aviso.value = ''
  usuarioEditado.value = usuario
  formularioAberto.value = true
}

function aoSalvar(usuario) {
  aviso.value = `${usuario.nome} salvo com sucesso.`
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
          <h1 class="fx-titulo">Usuários e perfis</h1>
          <p class="fx-subtitulo">
            Cadastre a equipe e defina com quais perfis cada pessoa entra. Um mesmo CPF pode ter vários perfis.
          </p>
        </div>
        <button type="button" class="fx-botao" @click="abrirFormulario()">Novo usuário</button>
      </header>

      <label class="fx-campo">
        Buscar
        <input v-model="busca" class="fx-entrada" placeholder="Nome ou CPF" />
      </label>

      <p v-if="aviso" class="fx-alerta fx-alerta-verde" role="status">{{ aviso }}</p>
      <p v-if="carregando" class="fx-alerta fx-alerta-cinza">Carregando usuários...</p>
      <p v-if="erro" class="fx-alerta fx-alerta-vermelho" role="alert">{{ erro }}</p>

      <div v-if="!carregando && !erro" class="fx-tabela-rolagem">
        <table class="fx-tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              <th>Perfis</th>
              <th>Vínculo</th>
              <th>Situação</th>
              <th><span class="sr-only">Ação</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in usuariosFiltrados" :key="u.id">
              <td>
                <strong>{{ u.nome }}</strong>
                <div v-if="u.postoGraduacao" class="fx-suave">{{ u.postoGraduacao }}</div>
              </td>
              <td class="fx-mono">{{ formatarCpf(u.cpf) }}</td>
              <td>
                <div class="selos">
                  <span v-for="p in u.perfis" :key="p" class="fx-selo fx-selo-cinza">{{ rotuloPerfil(p) }}</span>
                </div>
              </td>
              <td class="fx-suave">{{ vinculo(u) }}</td>
              <td>
                <span class="fx-selo" :class="u.ativo ? 'fx-selo-verde' : 'fx-selo-vermelho'">
                  {{ u.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td>
                <button type="button" class="fx-botao-secundario" @click="abrirFormulario(u)">Editar</button>
              </td>
            </tr>
            <tr v-if="usuariosFiltrados.length === 0">
              <td colspan="6" class="fx-suave">Nenhum usuário encontrado.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <UsuarioFormulario
      v-if="formularioAberto"
      :usuario="usuarioEditado"
      :ocs="ocs"
      @fechar="formularioAberto = false"
      @salvo="aoSalvar"
    />
  </main>
</template>

<style scoped>
.selos {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
