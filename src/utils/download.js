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