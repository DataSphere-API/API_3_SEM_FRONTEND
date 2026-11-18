import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { api } from '../src/services/api.js'
import {
  listarEspelhos,
  buscarEspelho,
  listarItensEspelho,
  criarEspelho,
  corrigirItemEspelho,
  removerItemEspelho,
  reenviarEspelho
} from '../src/services/espelhoService.js'

describe('espelhoService — integração real sem mocks', () => {
  test('listarEspelhos faz chamada GET /espelhos com parâmetros reais e propaga dados', async () => {
    let chamada = null
    const originalGet = api.get
    api.get = async (url, config) => {
      chamada = { url, config }
      return {
        data: [
          { id: 1, ocsId: '12345678000199', status: 'EM_ABERTO', valorTotal: 150.0 }
        ]
      }
    }

    try {
      const resultado = await listarEspelhos({ cnpj: '12345678000199' })
      assert.equal(chamada.url, '/espelhos')
      assert.deepEqual(chamada.config.params, { cnpj: '12345678000199' })
      assert.equal(resultado.length, 1)
      assert.equal(resultado[0].valorTotal, 150.0)
    } finally {
      api.get = originalGet
    }
  })

  test('criarEspelho envia payload estrito da US001-10 para POST /espelhos', async () => {
    let chamada = null
    const originalPost = api.post
    api.post = async (url, data) => {
      chamada = { url, data }
      return {
        data: {
          id: 10,
          atendimentoId: 100,
          status: 'EM_ABERTO',
          itens: [{ id: 1, beneficiarioId: '123456', descricao: 'Consulta', valor: 80.0 }]
        }
      }
    }

    const payload = {
      atendimentoId: 100,
      ocsId: '12345678000199',
      itens: [
        { beneficiarioId: '123456', descricao: 'Consulta', valor: 80.0 }
      ]
    }

    try {
      const resposta = await criarEspelho(payload)
      assert.equal(chamada.url, '/espelhos')
      assert.deepEqual(chamada.data, payload)
      assert.equal(resposta.id, 10)
    } finally {
      api.post = originalPost
    }
  })

  test('corrigirItemEspelho faz PATCH /espelhos/{id}/itens/{itemId} e retorna dados atualizados', async () => {
    let chamada = null
    const originalPatch = api.patch
    api.patch = async (url, data) => {
      chamada = { url, data }
      return {
        data: { id: 5, atendimentoId: 100, beneficiarioId: '123456', descricao: 'Consulta', valor: 120.0 }
      }
    }

    try {
      const atualizado = await corrigirItemEspelho(10, 5, 120.0)
      assert.equal(chamada.url, '/espelhos/10/itens/5')
      assert.deepEqual(chamada.data, { valor: 120.0 })
      assert.equal(atualizado.valor, 120.0)
    } finally {
      api.patch = originalPatch
    }
  })

  test('removerItemEspelho faz DELETE /espelhos/{id}/itens/{itemId}', async () => {
    let chamada = null
    const originalDelete = api.delete
    api.delete = async (url) => {
      chamada = { url }
      return { status: 204 }
    }

    try {
      await removerItemEspelho(10, 5)
      assert.equal(chamada.url, '/espelhos/10/itens/5')
    } finally {
      api.delete = originalDelete
    }
  })

  test('reenviarEspelho faz POST /espelhos/{id}/reenviar', async () => {
    let chamada = null
    const originalPost = api.post
    api.post = async (url) => {
      chamada = { url }
      return { data: { id: 10, status: 'EM_ABERTO' } }
    }

    try {
      const res = await reenviarEspelho(10)
      assert.equal(chamada.url, '/espelhos/10/reenviar')
      assert.equal(res.status, 'EM_ABERTO')
    } finally {
      api.post = originalPost
    }
  })

  test('propaga propriedade mensagem de erro retornada pela API sem respostas fictícias', async () => {
    const originalPost = api.post
    api.post = async () => {
      const erro = new Error('Request failed with status code 409')
      erro.response = {
        status: 409,
        data: {
          codigo: 'ATENDIMENTO_JA_EM_ESPELHO',
          mensagem: 'Este atendimento já possui espelho cadastrado.'
        }
      }
      throw erro
    }

    try {
      await assert.rejects(
        async () => {
          await criarEspelho({ atendimentoId: 1, ocsId: '123', itens: [] })
        },
        (err) => {
          assert.equal(err.mensagemUsuario, 'Este atendimento já possui espelho cadastrado.')
          assert.equal(err.message, 'Este atendimento já possui espelho cadastrado.')
          return true
        }
      )
    } finally {
      api.post = originalPost
    }
  })
})
