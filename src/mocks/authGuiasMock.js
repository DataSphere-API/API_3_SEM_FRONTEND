// Identidades fictícias dos seeds locais US003-5/US003-6. Ativar apenas em desenvolvimento.
const BENEFICIARIOS = [
  { id: 351, cpf: '00000000351', nome: 'Fulano de Tal', precCp: '123456789-00' },
  { id: 352, cpf: '00000000352', nome: 'Beltrano da Silva', precCp: '111111111-00' }
]

export async function mockLoginGuias(cpf, senha) {
  const usuario = BENEFICIARIOS.find(item => item.cpf === cpf)
  if (!usuario || senha !== 'fusex123') {
    const erro = new Error('CPF ou senha incorretos.')
    erro.response = { status: 401, data: { mensagem: erro.message } }
    throw erro
  }
  return {
    token: `mock-guias-${usuario.id}`,
    usuario: { ...usuario, perfis: ['BENEFICIARIO'] }
  }
}
