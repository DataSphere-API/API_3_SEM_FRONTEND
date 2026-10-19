export function erroDeFormato() {
  const erro = new Error('A resposta do servidor veio em um formato inesperado.')
  erro.mensagemUsuario = erro.message
  return erro
}

function mensagemDeErro(erro, textos) {
  const resposta = erro?.response
  if (!resposta) {
    if (erro?.code === 'ECONNABORTED') {
      return 'O servidor demorou demais para responder. Tente novamente.'
    }
    return 'Não foi possível conectar ao servidor. Verifique se o back-end está em execução.'
  }
  const dados = resposta.data
  if (dados && typeof dados === 'object' && typeof dados.mensagem === 'string') {
    return dados.mensagem
  }
  if (textos[resposta.status]) {
    return textos[resposta.status]
  }
  if (resposta.status >= 500) {
    return 'O servidor encontrou um erro. Tente novamente em instantes.'
  }
  return textos.padrao || 'Não foi possível concluir a operação.'
}

export function traduzirErro(erro, textos = {}) {
  if (erro?.mensagemUsuario) {
    return erro
  }
  console.error(erro)
  const dados = erro?.response?.data
  const novo = new Error(mensagemDeErro(erro, textos))

  novo.mensagemUsuario = novo.message
  novo.status = erro?.response?.status ?? null
  novo.codigo = dados && typeof dados === 'object' ? dados.codigo ?? null : null
  novo.dados = dados && typeof dados === 'object' ? dados : null
  return novo
}