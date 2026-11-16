import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'

// Backend com os perfis dev,qrconsulta-mock,guias-mock e banco descartável.
test.beforeEach(async ({ page }) => {
  await page.goto('/login?voltar=/beneficiario/minhas-guias')
  await page.getByLabel('CPF', { exact: true }).fill('00000000351')
  await page.getByLabel('Senha', { exact: true }).fill('fusex123')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.waitForURL('**/beneficiario/minhas-guias')
  await expect(page.getByText('2026-000003', { exact: true })).toBeVisible()
})

test('API real: número, QR somente liberado, ampliação e download PNG', async ({ page }) => {
  const consultas = []
  page.on('request', request => {
    if (request.url().includes('/qrcode')) consultas.push(request.url())
  })
  await page.getByRole('button', { name: 'Ver detalhes' }).first().click()
  await expect(page.getByRole('heading', { name: 'Guia 2026-000003' })).toBeVisible()
  const imagem = page.locator('.qr-imagem')
  await expect(imagem).toHaveCount(1)
  await expect(imagem).toBeVisible()
  expect(consultas).toEqual(['http://localhost:8080/atendimentos/4/qrcode'])
  const fonte = await imagem.getAttribute('src')
  expect(fonte).toMatch(/^data:image\/png;base64,/)
  await page.getByRole('button', { name: 'Ampliar', exact: true }).click()
  await expect(page.getByRole('dialog', { name: /QR Code ampliado/ })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: /QR Code ampliado/ })).toHaveCount(0)
  const downloadPendente = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Baixar PNG' }).click()
  const download = await downloadPendente
  expect(download.suggestedFilename()).toBe('qrcode-2026-000003-4.png')
  const png = await readFile(await download.path())
  expect(png.equals(Buffer.from(fonte.split(',')[1], 'base64'))).toBe(true)
  expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  expect(png.readUInt32BE(16)).toBe(320)
  await page.screenshot({ path: '/tmp/us0037-guia.png', fullPage: true })
})

for (const status of [403, 409]) {
  test(`não desenha nem oferece download quando o backend devolve ${status}`, async ({ page }) => {
    await page.route('**/atendimentos/4/qrcode', route => route.fulfill({
      status, json: { codigo: 'QR_INDISPONIVEL', mensagem: 'QR indisponível para este procedimento.' }
    }))
    await page.getByRole('button', { name: 'Ver detalhes' }).first().click()
    await expect(page.getByRole('alert').filter({ hasText: /QR indisponível/ })).toBeVisible()
    await expect(page.locator('.qr-imagem')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Baixar PNG' })).toHaveCount(0)
  })
}

test('resposta sem código não produz QR fictício', async ({ page }) => {
  await page.route('**/atendimentos/4/qrcode', route => route.fulfill({ json: {} }))
  await page.getByRole('button', { name: 'Ver detalhes' }).first().click()
  await expect(page.locator('.fx-alerta-vermelho')).toBeVisible()
  await expect(page.locator('.qr-imagem')).toHaveCount(0)
})
