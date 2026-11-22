// Salva no computador do usuário um arquivo recebido do back, sem alterar o conteúdo.
export function salvarArquivo(blob, nomeArquivo) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Dá tempo ao navegador de iniciar o download antes de liberar a URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Em download (responseType: 'blob') o erro do back também chega como Blob: converte para JSON.
export async function lerErroDeBlob(erro) {
  const dados = erro?.response?.data
  if (dados instanceof Blob) {
    try {
      erro.response.data = JSON.parse(await dados.text())
    } catch {
      erro.response.data = null
    }
  }
  return erro
}
