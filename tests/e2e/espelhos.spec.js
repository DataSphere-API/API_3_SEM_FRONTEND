import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('fusex-sessao', JSON.stringify({
      token: 'token-teste-ocs',
      perfilAtivo: 'OCS',
      usuario: {
        ocsCnpj: '12345678000199',
        nome: 'Clinica Teste',
        perfis: ['OCS']
      }
    }))
  })
})

test.describe('Listagem de Espelhos', () => {
  test('exibe espelhos com dados reais, valor total, motivoReprovacao e devolucoes', async ({ page }) => {
    await page.route('**/espelhos?cnpj=12345678000199', route =>
      route.fulfill({
        status: 200,
        json: [
          {
            id: 1,
            atendimentoId: 10,
            ocsId: '12345678000199',
            dataInicio: '2026-11-01',
            dataFim: '2026-11-30',
            status: 'REPROVADO',
            dataAtualizacao: '2026-11-18T10:00:00',
            ocsNome: 'Clinica Teste',
            quantidadeItens: 2,
            valorTotal: 250.0,
            motivoReprovacao: 'Valor acima da tabela de referência',
            devolucoes: 2
          }
        ]
      })
    )

    await page.goto('/ocs/espelhos')

    await expect(page.getByRole('heading', { name: 'Espelhos' })).toBeVisible()
    await expect(page.getByText('#1').first()).toBeVisible()
    await expect(page.getByText('R$ 250,00')).toBeVisible()
    await expect(page.getByText('Valor acima da tabela de referência')).toBeVisible()
    await expect(page.getByText('2 devoluções')).toBeVisible()
  })

  test('trata lista vazia e erro de comunicação com mensagem do backend', async ({ page }) => {
    await page.route('**/espelhos?cnpj=12345678000199', route =>
      route.fulfill({
        status: 500,
        json: { codigo: 'ERRO_BACKEND', mensagem: 'Falha ao buscar os espelhos da OCS.' }
      })
    )

    await page.goto('/ocs/espelhos')
    await expect(page.getByRole('alert')).toContainText('Falha ao buscar os espelhos da OCS.')
  })

  test('trata lista vazia quando não há espelhos', async ({ page }) => {
    await page.route('**/espelhos?cnpj=12345678000199', route =>
      route.fulfill({
        status: 200,
        json: []
      })
    )

    await page.goto('/ocs/espelhos')
    await expect(page.getByText('Nenhum espelho ainda')).toBeVisible()
  })
})

test.describe('Novo Espelho', () => {
  test('envia payload estrito US001-10 e redireciona', async ({ page }) => {
    await page.route('**/ocs/12345678000199/atendimentos', route =>
      route.fulfill({
        status: 200,
        json: [
          {
            atendimentoId: 42,
            guiaId: 101,
            beneficiario: { precCp: '98765432100', nome: 'Fulano Militar' },
            procedimento: 'Fisioterapia Motora',
            ocs: { cnpj: '12345678000199', nome: 'Clinica Teste' },
            qtdAutorizada: 1,
            qtdRealizada: 1,
            statusProcedimento: 'REALIZADA',
            dataRealizacao: new Date().toISOString()
          }
        ]
      })
    )

    let payloadEnviado = null
    await page.route('**/espelhos', async route => {
      if (route.request().method() === 'POST') {
        payloadEnviado = route.request().postDataJSON()
        await route.fulfill({
          status: 200,
          json: {
            id: 99,
            atendimentoId: 42,
            status: 'EM_ABERTO',
            itens: [{ id: 1, beneficiarioId: '98765432100', descricao: 'Fisioterapia Motora', valor: 150 }]
          }
        })
      } else {
        await route.fallback()
      }
    })

    await page.route('**/espelhos?cnpj=12345678000199', route =>
      route.fulfill({
        status: 200,
        json: []
      })
    )

    await page.goto('/ocs/espelhos/novo')
    await expect(page.getByText('Fisioterapia Motora')).toBeVisible()

    const campoValor = page.locator('.campo-valor').first()
    await campoValor.fill('150')

    await page.getByRole('button', { name: 'Enviar espelho para auditoria' }).click()
    await page.waitForURL('**/ocs/espelhos')

    expect(payloadEnviado).toEqual({
      atendimentoId: 42,
      ocsId: '12345678000199',
      itens: [
        {
          beneficiarioId: '98765432100',
          descricao: 'Fisioterapia Motora',
          valor: 150
        }
      ]
    })
  })

  test('apresenta mensagem de erro retornada pelo backend', async ({ page }) => {
    await page.route('**/ocs/12345678000199/atendimentos', route =>
      route.fulfill({
        status: 200,
        json: [
          {
            atendimentoId: 42,
            guiaId: 101,
            beneficiario: { precCp: '98765432100', nome: 'Fulano Militar' },
            procedimento: 'Fisioterapia Motora',
            ocs: { cnpj: '12345678000199', nome: 'Clinica Teste' },
            qtdAutorizada: 1,
            qtdRealizada: 1,
            statusProcedimento: 'REALIZADA',
            dataRealizacao: new Date().toISOString()
          }
        ]
      })
    )

    await page.route('**/espelhos', route => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 409,
          json: { codigo: 'ATENDIMENTO_JA_EM_ESPELHO', mensagem: 'Atendimento já possui espelho ativo.' }
        })
      }
      return route.fallback()
    })

    await page.goto('/ocs/espelhos/novo')
    await expect(page.getByText('Fisioterapia Motora')).toBeVisible()

    const campoValor = page.locator('.campo-valor').first()
    await campoValor.fill('150')

    await page.getByRole('button', { name: 'Enviar espelho para auditoria' }).click()
    await expect(page.getByRole('alert')).toContainText('Atendimento já possui espelho ativo.')
  })
})

test.describe('Corrigir Espelho', () => {
  test('corrige item, remove item e reenvia com dados reais do backend', async ({ page }) => {
    await page.route('**/espelhos/5', route =>
      route.fulfill({
        status: 200,
        json: {
          id: 5,
          atendimentoId: 42,
          ocsId: '12345678000199',
          dataInicio: '2026-11-01',
          dataFim: '2026-11-30',
          status: 'REPROVADO',
          motivoReprovacao: 'Valor cobrado alto',
          valorTotal: 300
        }
      })
    )

    await page.route('**/espelhos/5/itens', route =>
      route.fulfill({
        status: 200,
        json: [
          { id: 1, atendimentoId: 42, beneficiarioId: '111', descricao: 'Procedimento 1', valor: 100 },
          { id: 2, atendimentoId: 43, beneficiarioId: '222', descricao: 'Procedimento 2', valor: 200 }
        ]
      })
    )

    let itemRemovido = null
    await page.route('**/espelhos/5/itens/2', route => {
      if (route.request().method() === 'DELETE') {
        itemRemovido = 2
        return route.fulfill({ status: 204 })
      }
      return route.fallback()
    })

    await page.route('**/espelhos/5/reenviar', route =>
      route.fulfill({
        status: 200,
        json: { id: 5, status: 'EM_ABERTO' }
      })
    )

    await page.route('**/espelhos?cnpj=12345678000199', route =>
      route.fulfill({
        status: 200,
        json: []
      })
    )

    await page.goto('/ocs/espelhos/5/corrigir')

    await expect(page.getByText('Motivo da reprovação:')).toBeVisible()
    await expect(page.getByText('Valor cobrado alto')).toBeVisible()
    await expect(page.getByText('Procedimento 1')).toBeVisible()
    await expect(page.getByText('Procedimento 2')).toBeVisible()
    await expect(page.getByText('Total: R$ 300,00')).toBeVisible()

    // Clica para remover Procedimento 2
    await page.getByRole('button', { name: 'Tirar do espelho' }).nth(1).click()

    expect(itemRemovido).toBe(2)
    await expect(page.getByText('Procedimento 2')).toHaveCount(0)
    await expect(page.getByText('Total: R$ 100,00')).toBeVisible()

    // Reenvia
    await page.getByRole('button', { name: 'Reenviar para auditoria' }).click()
    await page.waitForURL('**/ocs/espelhos?reenviado=5')
  })

  test('exibe erro retornado pelo backend ao falhar ao remover item', async ({ page }) => {
    await page.route('**/espelhos/5', route =>
      route.fulfill({
        status: 200,
        json: {
          id: 5,
          atendimentoId: 42,
          ocsId: '12345678000199',
          status: 'REPROVADO',
          motivoReprovacao: 'Valor alto',
          valorTotal: 100
        }
      })
    )

    await page.route('**/espelhos/5/itens', route =>
      route.fulfill({
        status: 200,
        json: [
          { id: 1, atendimentoId: 42, beneficiarioId: '111', descricao: 'Procedimento 1', valor: 100 }
        ]
      })
    )

    await page.route('**/espelhos/5/itens/1', route => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({
          status: 422,
          json: { codigo: 'ESPELHO_SEM_ITENS', mensagem: 'Não é permitido remover o único item do espelho.' }
        })
      }
      return route.fallback()
    })

    await page.goto('/ocs/espelhos/5/corrigir')
    await page.getByRole('button', { name: 'Tirar do espelho' }).click()
    await expect(page.getByRole('alert')).toContainText('Não é permitido remover o único item do espelho.')
  })
})
