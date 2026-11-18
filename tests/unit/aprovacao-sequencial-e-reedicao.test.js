import { describe, it } from 'node:test'
import assert from 'node:assert'

// Setup global browser mocks before importing modules that rely on window/localStorage/sessionStorage
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    addEventListener: () => {},
    removeEventListener: () => {}
  }
}
const createStorage = () => {
  const store = new Map()
  return {
    getItem: (k) => store.get(k) || null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
  }
}
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = createStorage()
}
if (typeof globalThis.sessionStorage === 'undefined') {
  globalThis.sessionStorage = createStorage()
}

const {
  EDITAVEIS,
  ehAprovadaPeloMedico,
  ehAguardandoAprovacaoMedico,
  ehAguardandoAprovacaoChefe,
  filtrarFilaAprovacao,
  filtrarFilaPendentes
} = await import('../../src/utils/fluxoPreGuia.js')

const { mockEditarPreGuia, mockAprovarPreGuia } = await import('../../src/mocks/fluxoPreGuiaMock.js')
const { banco } = await import('../../src/mocks/bancoMock.js')
const { iniciarSessao, escolherPerfil } = await import('../../src/stores/sessao.js')

describe('US005 - Fila de aprovação sequencial', () => {
  const preGuiasExemplo = [
    { id: 1, status: 'APROVACAO_MEDICO_PENDENTE', medicoAprovou: false, chefeAprovou: false },
    { id: 2, status: 'VALIDADA', medicoAprovou: false, chefeAprovou: false },
    { id: 3, status: 'VALIDADA', medicoAprovou: true, dataAprovacaoMedico: '2026-10-09T10:00:00', chefeAprovou: false },
    { id: 4, status: 'APROVADA', medicoAprovou: true, chefeAprovou: true },
    { id: 5, status: 'REPROVADA', medicoAprovou: false, chefeAprovou: false, motivoReprovacao: 'Não indicado' }
  ]

  it('Médico continua recebendo pré-guias APROVACAO_MEDICO_PENDENTE e VALIDADA pendente de médico', () => {
    const pendentesMedico = filtrarFilaPendentes(preGuiasExemplo, 'MEDICO')
    const ids = pendentesMedico.map(p => p.id)
    assert.ok(ids.includes(1), 'Médico deve receber APROVACAO_MEDICO_PENDENTE')
    assert.ok(ids.includes(2), 'Médico deve receber VALIDADA não aprovada pelo médico')
    assert.ok(!ids.includes(3), 'Médico não deve ter pré-guia já aprovada como pendente')
  })

  it('Chefe recebe pré-guias aprovadas pelo médico e aguardando aprovação do chefe', () => {
    const pendentesChefe = filtrarFilaPendentes(preGuiasExemplo, 'CHEFE')
    const ids = pendentesChefe.map(p => p.id)
    assert.deepStrictEqual(ids, [3], 'Fila pendente do chefe deve conter apenas pré-guia aprovada pelo médico e aguardando chefe')
  })

  it('Chefe não recebe pré-guias APROVACAO_MEDICO_PENDENTE nem pré-guias sem aprovação médica', () => {
    const todasChefe = filtrarFilaAprovacao(preGuiasExemplo, 'CHEFE')
    const pendentesChefe = filtrarFilaPendentes(todasChefe, 'CHEFE')

    assert.ok(!todasChefe.some(p => p.status === 'APROVACAO_MEDICO_PENDENTE'), 'Chefe nunca recebe APROVACAO_MEDICO_PENDENTE')
    assert.ok(!todasChefe.some(p => !p.medicoAprovou && !p.dataAprovacaoMedico), 'Chefe só vê guias aprovadas pelo médico')
    assert.ok(!pendentesChefe.some(p => p.status === 'APROVACAO_MEDICO_PENDENTE'), 'Chefe não recebe APROVACAO_MEDICO_PENDENTE em pendentes')
  })

  it('Pré-guias já reprovadas não aparecem indevidamente na fila de aprovação', () => {
    const pendentesMedico = filtrarFilaPendentes(preGuiasExemplo, 'MEDICO')
    const pendentesChefe = filtrarFilaPendentes(preGuiasExemplo, 'CHEFE')
    const listaChefe = filtrarFilaAprovacao(preGuiasExemplo, 'CHEFE')

    assert.ok(!pendentesMedico.some(p => p.status === 'REPROVADA'), 'Reprovada não aparece para médico')
    assert.ok(!pendentesChefe.some(p => p.status === 'REPROVADA'), 'Reprovada não aparece para chefe')
    assert.ok(!listaChefe.some(p => p.status === 'REPROVADA'), 'Reprovada não aparece na lista do chefe')
  })

  it('Chefe não consegue aprovar antes do médico', async () => {
    iniciarSessao({ token: 'teste', usuario: { id: 1, perfis: ['CHEFE'] } })
    escolherPerfil('CHEFE')

    // Pre-guia 3 no bancoMock não tem dataAprovacaoMedico
    await assert.rejects(
      async () => {
        await mockAprovarPreGuia(3)
      },
      (err) => {
        return err.response?.data?.codigo === 'APROVACAO_MEDICO_PENDENTE' || err.response?.status === 409
      }
    )
  })
})

describe('US005 - Reedição de pré-guias reprovadas', () => {
  it('REPROVADA está presente em EDITAVEIS', () => {
    assert.ok(EDITAVEIS.includes('REPROVADA'), 'REPROVADA deve ser um status editável')
    assert.ok(EDITAVEIS.includes('PRE_GUIA'), 'PRE_GUIA deve ser editável')
    assert.ok(EDITAVEIS.includes('COM_PENDENCIAS'), 'COM_PENDENCIAS deve ser editável')
    assert.ok(!EDITAVEIS.includes('APROVADA'), 'APROVADA não deve ser editável')
    assert.ok(!EDITAVEIS.includes('EMITIDA'), 'EMITIDA não deve ser editável')
  })

  it('Emissor consegue editar uma pré-guia REPROVADA e ela volta para PRE_GUIA sem aprovação automática', async () => {
    // No bancoMock, preGuia 8 é REPROVADA
    const db = banco()
    const pg8 = db.preGuias.find(p => p.id === 8)
    assert.strictEqual(pg8.status, 'REPROVADA')
    assert.ok(pg8.motivoReprovacao, 'Deve ter motivoReprovacao')
    const motivoOriginal = pg8.motivoReprovacao

    const dadosEdicao = {
      beneficiarioPrecCp: '123456789-00',
      medicoId: 1,
      procedimentos: [{ procedimentoId: 3, ocsCnpj: '00111222000133', quantidade: 2 }]
    }

    const editada = await mockEditarPreGuia(8, dadosEdicao)

    assert.strictEqual(editada.status, 'PRE_GUIA', 'Ao editar, status deve voltar para PRE_GUIA')
    assert.strictEqual(editada.dataAprovacaoMedico, null, 'Não deve ter aprovação médica automática')
    assert.strictEqual(editada.dataAprovacaoChefe, null, 'Não deve ter aprovação de chefe automática')
    assert.strictEqual(editada.motivoReprovacao, motivoOriginal, 'motivoReprovacao deve ser preservado na edição')
  })

  it('Não permite editar outros status não autorizados (ex: APROVADA ou EMITIDA)', async () => {
    const dados = {
      beneficiarioPrecCp: '100100100-00',
      medicoId: 1,
      procedimentos: [{ procedimentoId: 1, ocsCnpj: '00111222000133', quantidade: 1 }]
    }
    // id 5 é APROVADA
    await assert.rejects(
      async () => {
        await mockEditarPreGuia(5, dados)
      },
      (err) => err.response?.data?.codigo === 'PRE_GUIA_STATUS_INVALIDO' || err.response?.status === 409
    )
    // id 6 é EMITIDA
    await assert.rejects(
      async () => {
        await mockEditarPreGuia(6, dados)
      },
      (err) => err.response?.data?.codigo === 'PRE_GUIA_STATUS_INVALIDO' || err.response?.status === 409
    )
  })
})
