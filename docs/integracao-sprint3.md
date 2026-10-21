# Sprint 3 — ligar as telas ao back

Levantamento de 21/10/2026, feito sobre o `dev` do back e os PRs abertos (#20 a #28). Objetivo:
**manter as telas que já temos, mudar o mínimo das issues** e, quando der, adaptar o front em vez do back.

## Em 1 minuto

- Hoje o front roda 100% no mock (`VITE_USE_MOCK=true`). Com as adaptações do front propostas aqui, as
  telas usam **39 chamadas** ao back:

  | Situação no back | Chamadas |
  |---|---|
  | ✅ Já existe no `dev` | 12 |
  | 🟡 Existe num PR aberto (ainda não está no `dev`) | 6 |
  | ❌ Não existe | 21 |

- **Boa notícia:** o espelho e a fatura do `dev` já cobrem quase todo o fluxo da OCS e do auditor, desde
  que o front se adapte. Exemplo: **aprovar o espelho = `POST /faturas`**, que já existe. Com isso, saem do
  pacote do back a "fatura mensal" e o "aprovar espelho" que eu tinha pedido antes.
- **Pré-guia não existe no banco ainda:** os PRs #24, #26 e #28 e a branch da #76 respondem com
  **dados fixos (mock)** e esperam a US000-11 (PR #23). O #23 é o PR que destrava a Sprint 3.
- **O que trava tudo:** login (#41 sem contrato), PRs abertos contra a `main` e migrations com número
  repetido (seção 0).

Legenda da coluna **Bate?**: ✔ bate como está · ≈ bate se o front se adaptar (sem mexer no back) ·
✖ precisa de ajuste no back.

---

## 0. Arrumação antes de ligar (back)

| # | Problema | O que fazer | Quem |
|---|---|---|---|
| 1 | Os PRs **#21, #22, #24, #25, #26 e #28 apontam para a `main`**; os outros vão para o `dev` | Trocar a base deles para `dev` (botão *Edit* no PR) | autor de cada PR |
| 2 | **Migrations repetidas:** duas V7 (`fatura_encaminhamento` no dev × `guia_proc_campos_conferencia` no #21/#22/#25), duas V8 (`guia_estrutura` no #23 × `guia_proc_data_validacao` no #25) e uma V10 sem V9 (#27) | Ordem sugerida: **V8 = #23** (entra primeiro). O #25 tira a V7 e a V8 dele; o que a V8 do #23 ainda não tem (`Qtd_Realizada`, `Data_Validade`) vira a **V9**. O #27 apaga a V10: a tabela `Pre_Guia` nova **duplica a `Guia`**, e a V8 do #23 já tem `Chefe_ID`, `Data_Aprovacao_Medico`, `Data_Aprovacao_Chefe` e `Motivo_Reprovacao` | vncssd, Glei, Carolina |
| 3 | Pré-guia em mock: #24, #26, #28 e a branch `US005-3-detalhe-pre-guia` (**sem PR**) têm `TODO(US000-11): MOCK TEMPORÁRIO` | Depois do #23, trocar o mock pela leitura da `Guia`/`Guia_Proc`. A pré-guia é uma linha da `Guia` com `Status = PRE_GUIA` | Rafael |
| 4 | Status com grafias diferentes: o espelho confere `"Realizada"`, mas a V8 faz `UPPER(Status)` e as issues usam `REALIZADA` | Padronizar tudo em maiúsculas | matquirin0 |
| 5 | Vários endpoints devolvem **texto puro** no erro (`"espelho não encontrado"`) em vez de `{ codigo, mensagem }` (US000-12, #89) | Não bloqueia: o front passa a aceitar os dois (tarefa F1). Padronizar quando der | vncssd |
| 6 | Dados de teste: sem carga não dá para testar nada de ponta a ponta | Priorizar **#91 (carga V8)** e **#74 (pré-guias de teste)**. Sugestão: usar os mesmos dados do mock do front (`src/mocks/bancoMock.js`) | vncssd |

CORS para `localhost:5173` já está liberado e o front aponta para `http://localhost:8080`. Nada a fazer aí.

---

## 1. Tela por tela

### Acesso (todos)

| Tela | O front chama | No back | Bate? | O que fazer |
|---|---|---|---|---|
| Login | `POST /auth/login` | ❌ #41 sem contrato | ✖ | **Back:** contrato da seção 2 do `o-que-precisamos-do-back.md`, mais `chefeId` e `medicoId` no `usuario` (ver Aprovação) |
| Primeiro acesso | `POST /auth/cadastro` | ❌ | ✖ | **Back:** issue nova (card B1) |
| Escolher perfil | — | — | ✔ | Só front |

### Chefe do FUSEx

| Tela | O front chama | No back | Bate? | O que fazer |
|---|---|---|---|---|
| Aprovação | `GET /pre-guias?status=` | ❌ #75 sem código | ✖ | **Back:** #75 + `medicoAprovou`, `chefeAprovou`, `dataEmissao` no resumo |
| | `GET /pre-guias/{id}` | 🟡 branch da #76, sem PR, mock | ≈ | **Front:** ler `qtdSessoes` como quantidade e `medico.crm`. **Back:** abrir o PR, ler do banco e incluir `medico.nome` e as datas de aprovação |
| | `PATCH /pre-guias/{id}/aprovar` e `/reprovar` | 🟡 #27 | ✖ | **Back (#77):** aceitar também o **médico**: header `X-Medico-Id` além do `X-Chefe-Id`, que já existe. Gravar na `Guia` (V8) e só virar `APROVADA` com as duas datas. **Front:** mandar o header do perfil ativo |
| Usuários | `GET/POST /usuarios`, `GET /beneficiarios?busca=` | ❌ | ✖ | **Back:** card B2 |
| OCS | `GET/POST /ocs` | ❌ (a entidade e o repositório já existem) | ✖ | **Back:** card B3 |
| Contratos | `GET/POST /contratos`, `GET/POST /procedimentos` | ❌ (as entidades já existem) | ✖ | **Back:** card B3 |

### Médico

| Tela | O front chama | No back | Bate? | O que fazer |
|---|---|---|---|---|
| Nova solicitação | `POST /pre-guias` → `validar` → `aprovar` | ❌ / 🟡 #28 / 🟡 #27 | ✖ | **Back:** criar e editar a pré-guia (card B4). O `validar` (#82) **bate como está**: `{ preGuiaId, status, validada, pendencias }` |
| Aprovação | igual ao chefe | | | Mesmo ajuste do #27 |

### Emissor

| Tela | O front chama | No back | Bate? | O que fazer |
|---|---|---|---|---|
| Criar / editar pré-guia | `POST /pre-guias`, `PUT /pre-guias/{id}`, `GET /medicos`, `GET /contratos`, `GET /beneficiarios?busca=` | ❌ | ✖ | **Back:** cards B2, B3 e B4 |
| Acompanhamento | `GET /pre-guias`, `POST /pre-guias/{id}/validar` | ❌ #75 / 🟡 #28 | ≈ | Igual à Aprovação |
| Aprovadas (emitir) | `POST /pre-guias/{id}/emitir` | ❌ #78 sem código | ✖ | **Back:** #78 como está na issue |

### Beneficiário

| Tela | O front chama | No back | Bate? | O que fazer |
|---|---|---|---|---|
| Minhas guias | `GET /beneficiarios/{precCp}/guias` | 🟡 #26, mock (só o Prec-CP `123456`) | ≈ | **Front:** aceitar o campo `procedimAentos` (erro de digitação no DTO). **Back:** corrigir para `procedimentos` e ler do banco |
| Confirmar atendimento | `GET /beneficiarios/{precCp}/confirmacoes-pendentes` | ❌ | ✖ | **Back:** card B5 |
| | Confirmar → **`POST /atendimentos/{id}/sessoes`** `{ cnpj }` | 🟡 #25 | ≈ | **Mudança no front:** quem chama o "registrar sessão" da #72 passa a ser a **confirmação do beneficiário**, e não mais a OCS. Assim a #72 continua sendo exatamente o que diz a issue. **Back (#72):** recalcular o status a cada sessão (`EM_ANDAMENTO`, ou `REALIZADA` quando o saldo chega a 0); hoje só muda na primeira |
| | Recusar → `DELETE /atendimentos/{id}/pedido-confirmacao` | ❌ | ✖ | **Back:** card B5. É o mesmo endpoint do "desfazer" da OCS |

### OCS

| Tela | O front chama | No back | Bate? | O que fazer |
|---|---|---|---|---|
| Atendimentos | `GET /ocs/{cnpj}/atendimentos` | ✅ dev | ✖ | Hoje devolve a **entidade** `GuiaProcModel` (o contrato é *lazy*, então a resposta tende a quebrar ao virar JSON) e **404 quando a lista está vazia**. **Back:** devolver um DTO (cabe na US000-14, #92). **Front:** tratar 404 como lista vazia |
| | Realizar → `POST /atendimentos/{id}/pedido-confirmacao` `{ cnpj }` | ❌ | ✖ | **Back:** card B5. Só muda o `Guia_Proc.Status` para `AGUARDANDO_CONFIRMACAO`, com as mesmas validações da #72 (o `ValidarSessaoService` pode ser reaproveitado) |
| | Desfazer → `DELETE /atendimentos/{id}/pedido-confirmacao` | ❌ | ✖ | Card B5 |
| Espelhos (lista) | `GET /espelhos?cnpj=` | ✅ dev | ≈ | **Front:** mapear `id`, `ocsNome`, `quantidadeItens`, `valorTotal`. O selo **"Reenviado após devolução" sai do `GET /espelhos/{id}/historico`** (✅), contando as idas para `REPROVADO`, sem DTO novo |
| Novo espelho | `POST /espelhos` | ✅ dev | ✖ | Hoje aceita **um** atendimento só e grava as datas como "hoje". **Back (US001-4):** aceitar `dataInicio`, `dataFim` e `atendimentoId` em cada item e validar item por item (`REALIZADA`, da OCS, fora de outro espelho). **Front:** mandar também `beneficiarioId` e `descricao` de cada item, que a tela já tem, para o back não ter que buscar. A trava do mês com 5 dias de tolerância já está no front |
| Corrigir espelho | `PATCH` e `DELETE /espelhos/{id}/itens/{itemId}` | ✅ dev | ≈ | **Front:** o PATCH sobrescreve os três campos, então mandar o item inteiro (`beneficiarioId`, `descricao`, `valor`), e não só o valor |
| | `POST /espelhos/{id}/reenviar` | ❌ | ✖ | **Back:** card B6 |

### Auditor

| Tela | O front chama | No back | Bate? | O que fazer |
|---|---|---|---|---|
| Espelhos recebidos | `GET /espelhos?status=EM_ABERTO`, `GET /espelhos/{id}/itens` | ✅ dev | ≈ | **Front:** calcula o valor de contrato de cada item pelo `GET /contratos` (OCS do espelho + procedimento do item), sem campo novo no back. **Atenção:** o PR #20 (US000-14) **tira o `atendimentoId` do item**; pedir para manter |
| | **Aprovar → `POST /faturas` `{ espelhoId }`** | ✅ dev | ≈ | Esse endpoint já faz o que o "aprovar" faz: `EM_ABERTO` → `FATURADO` e cria a fatura com os itens. **Front:** o botão Aprovar chama ele, e a tela mostra `FATURADO` como "Aprovado" |
| | Reprovar → `PATCH /espelhos/{id}/reprovar` `{ motivo }` | ❌ | ✖ | **Back:** card B6 (+ a **única coluna nova**) |
| Histórico | `GET /pre-guias`, `GET /guias/{id}/historico`, `GET /espelhos/{id}/historico` | ❌ / ✅ / ✅ | ✔ | Depende só da #75 |
| Faturas mensais | `GET /faturas`, `GET /faturas/{id}` | ✅ dev | ≈ | O back tem **uma fatura por espelho aprovado**. **Front:** agrupa por OCS + mês do espelho e monta a "fatura mensal" na tela (o mês e os itens saem do `GET /espelhos` e do `GET /espelhos/{id}/itens`). A tela continua igual |
| | `POST /faturas/{id}/encaminhar` | ✅ dev | ✖ pequeno | **Front:** encaminhar o mês = chamar para cada fatura do grupo. A trava "só depois do dia 5" fica no front. **Back (US002-3):** tirar a regra "todos os itens autorizados pela lisura", senão um item acima do contrato **já aprovado pelo auditor** bloqueia o envio |

**Ajuste pequeno na US001-6 (fatura):** o `MontarItensFaturaService` usa o contrato do **primeiro**
atendimento do espelho para todos os itens. Com vários atendimentos por espelho, cada item precisa
usar o contrato do próprio `atendimentoId`.

---

## 2. O que muda no front (eu faço)

| # | Onde | O quê |
|---|---|---|
| F1 | `utils/erros.js` | Aceitar erro em texto puro e os códigos soltos do #27 (`PRE_GUIA_NAO_VALIDADA`…), além de `{ codigo, mensagem }` |
| F2 | `checkMutuoService.js` | OCS: "Realizar" → `POST /pedido-confirmacao`. Beneficiário: "Confirmar" → `POST /sessoes` (#72). "Recusar" → `DELETE /pedido-confirmacao`. 404 na lista vira lista vazia |
| F3 | `espelhoService.js` | Criar com `dataInicio`/`dataFim` e itens completos; normalizar a lista; valor de contrato pelo `GET /contratos`; **aprovar = `POST /faturas`**; `FATURADO` = "Aprovado"; devoluções pelo histórico; PATCH com o item inteiro |
| F4 | `faturaMensalService.js` | Montar a fatura mensal agrupando as faturas por OCS + mês; encaminhar todas do grupo |
| F5 | `guiasService.js` e `fluxoPreGuiaService.js` | Normalizar o #26 (`procedimAentos`) e o #76 (`qtdSessoes`, `medico`); mandar `X-Chefe-Id` / `X-Medico-Id` na aprovação |
| F6 | `mocks/` | Os mocks passam a imitar **exatamente** o back acima, para o modo mock e o modo back se comportarem igual |
| F7 | `services/` | Hoje o `VITE_USE_MOCK` liga ou desliga **tudo**. Trocar por uma lista dos módulos que já usam o back (ex.: `VITE_USAR_BACK=espelhos,faturas`), para ligar tela a tela |

Nenhuma tela muda de cara: as adaptações ficam nos *services*.

---

## 3. O que muda nas issues do back

### Ajustes em issues que já existem (🔧)

| Issue | Ajuste | Tamanho |
|---|---|---|
| #41 US000-6 | Contrato do login: `{ cpf, senha }` → `{ token, usuario: { id, nome, cpf, perfis, precCp, crm, ocsCnpj, cargo, chefeId, medicoId } }` | define o formato |
| #77 US005-4 (PR #27) | Médico também aprova/reprova (`X-Medico-Id`); usar a `Guia` da V8 em vez da tabela `Pre_Guia`; `APROVADA` só com as duas aprovações | médio |
| #75 US005-2 | Campos `medicoAprovou`, `chefeAprovou`, `dataEmissao` no resumo; médico vê só as dele | pequeno |
| #76 US005-3 | Abrir o PR; ler do banco; `medico.nome`, datas de aprovação, `motivoReprovacao` | pequeno |
| #64 US003-2 (PR #26) | Corrigir `procedimAentos`; ler do banco | pequeno |
| #72 US004-6 (PR #25) | Recalcular o status a cada sessão; acertar as migrations (seção 0) | pequeno |
| #92 US000-14 (PR #20) | Manter `atendimentoId` no item do espelho; DTO para `GET /ocs/{cnpj}/atendimentos` | pequeno |
| #49 US001-4 | Espelho com vários atendimentos e período (`dataInicio`, `dataFim`, `atendimentoId` por item) | médio |
| #51 US001-6 | Contrato por item na fatura | pequeno |
| #55 US002-3 | Tirar a regra de "itens autorizados" do encaminhar | pequeno |

**Não precisa mais** (comparado à lista anterior): fatura mensal no back, `PATCH /espelhos/{id}/aprovar`,
`valorContratado` e `devolucoes` no DTO do espelho e o `PATCH /atendimentos/{id}/confirmar`.

### Issues novas (🆕) — no formato do time

> **B1 · US000-16 Autocadastro do beneficiário P[3]**
> `POST /auth/cadastro` `{ precCp, dataNascimento, cpf, senha }` → confere Prec-CP + nascimento no
> `Beneficiario`, cria o `Usuario` e liga pelo `Usuario_ID`. Erros: 422 `BENEFICIARIO_NAO_CONFERE`,
> 409 `BENEFICIARIO_JA_CADASTRADO`, 409 `CPF_JA_CADASTRADO`.

> **B2 · US000-17 Usuários, médicos e busca de beneficiários P[5]**
> `GET/POST /usuarios`, `GET /medicos`, `GET /beneficiarios?busca=` (contratos na seção 2 do
> `o-que-precisamos-do-back.md`).
> O `POST /usuarios` **não cria login de militar**: só acrescenta perfis a quem já fez o autocadastro
> (B1). Login com CPF e senha pelo chefe só para funcionário de OCS.

> **B3 · US000-18 OCS, procedimentos e contratos P[4]**
> `GET/POST /ocs`, `GET/POST /procedimentos`, `GET/POST /contratos`. Só listar e cadastrar.

> **B4 · US005-8 Criar e editar pré-guia P[5]**
> `POST /pre-guias` e `PUT /pre-guias/{id}` com `{ beneficiarioPrecCp, medicoId, procedimentos: [{ procedimentoId, ocsCnpj, quantidade }] }`.
> Grava `Guia` (`PRE_GUIA`) + um `Guia_Proc` por procedimento. Editar só em `PRE_GUIA`/`COM_PENDENCIAS`.

> **B5 · US004-8 Pedido de confirmação do atendimento (check mútuo) P[4]**
> `POST /atendimentos/{id}/pedido-confirmacao` `{ cnpj }` → `Guia_Proc.Status = AGUARDANDO_CONFIRMACAO`
> (validações da #72). `DELETE` do mesmo caminho → volta ao status anterior (OCS desfaz ou beneficiário
> recusa). `GET /beneficiarios/{precCp}/confirmacoes-pendentes` → `[{ atendimentoId, procedimento, ocs { cnpj, nome }, qtdAutorizada, qtdRealizada, guiaId }]`.

> **B6 · US001-10 Reprovar e reenviar espelho P[3]**
> `PATCH /espelhos/{id}/reprovar` `{ motivo }` → `REPROVADO` (novo valor no enum `StatusEspelho`).
> `POST /espelhos/{id}/reenviar` → `REPROVADO` → `EM_ABERTO`. Os dois gravam o histórico.
> `motivoReprovacao` no resumo do espelho.

**Banco:** continua só uma coluna nova, com o número da próxima migration livre:
```sql
ALTER TABLE Espelho ADD COLUMN Motivo_Reprovacao VARCHAR(255);
```

---

## 4. Ordem sugerida

1. **Arrumação** (seção 0): base dos PRs, migrations e merge do **#23**. Depois, carga de dados #91/#74.
2. **Login** (#41) + B1. Sem isso, nenhuma tela abre com o back.
3. **Espelho e fatura** (US001-4, US001-6, US002-3, B6, #92): o back já tem quase tudo, então é a
   entrega mais rápida e a que mais aparece na demo (OCS → auditor → fatura).
4. **Cadastros** (B2, B3) e **pré-guia** (B4, #75, #76, #27, #28, #78).
5. **Check mútuo** (#25 + B5).

Do lado do front: F1 e F7 já; F3/F4 junto com o passo 3; F2 junto com o passo 5. Com o F7 dá para ligar
**tela a tela**: o módulo que já tem back usa o back, e o resto continua no mock.

## Issues do front que podem fechar

#80 (US005-7, detalhe e ações da pré-guia), #90 (US000-13, camada HTTP e mock) e #58 (US002-4, aba de
auditoria) estão cobertas pelas telas novas. Dá para fechar quando o PR do front entrar.
