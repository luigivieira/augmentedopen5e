# Augmented Open5e (Open5e Aumentado)

<p align="left">
  <a href="README.md"><img src="https://flagcdn.com/w40/us.png" alt="English" width="22" style="opacity: 0.5;"></a>&nbsp;&nbsp;
  <a href="LEIAME.md"><img src="https://flagcdn.com/w40/br.png" alt="Português" width="32" style="opacity: 1;"></a>&nbsp;&nbsp;
  <a href="LEAME.md"><img src="https://flagcdn.com/w40/es.png" alt="Español" width="22" style="opacity: 0.5;"></a>
</p>

Uma API REST open-source (Licença MIT) deployada no **Azion Edge Functions** que atua como uma camada de "aumento" (augmentation) sobre a [API pública do Open5e](https://api.open5e.com/).

Ela serve conteúdo do System Reference Document (SRD) de Dungeons & Dragons 5ª Edição e o estende automaticamente com traduções geradas por Inteligência Artificial (LLMs da Hugging Face) para diferentes idiomas.

> **⚠️ AVISO — Sobre Direitos Autorais:** Este projeto baseia-se inteiramente no SRD (System Reference Document) de D&D 5e, que é disponibilizado sob licença Creative Commons (CC-BY). **As traduções fornecidas por esta API são estritamente geradas por máquina (via IA/LLMs) sob demanda e NÃO SÃO traduções oficiais.** Este projeto não é afiliado, endossado ou criado com o intuito de reproduzir as obras traduzidas protegidas por direitos autorais da Wizards of the Coast ou de qualquer um de seus parceiros locais de publicação.

## Funcionalidades

- **Edge Native**: Roda globalmente em V8 isolates via [Azion Edge Functions](https://www.azion.com/pt-br/produtos/edge-functions/) para latência ultrabaixa.
- **Auto-Tradução**: Traduz automaticamente magias para o idioma solicitado ("locale") utilizando endpoints de Inferência do Hugging Face (suporte a monstros e itens está planejado para versões futuras).
- **Motor de Tradução Assíncrono**: Previne timeouts no Edge retornando dados parciais imediatamente enquanto aciona traduções em background.
- **Cache em Edge SQL**: Faz o cache das entidades traduzidas (e possivelmente até das strings originais em inglês da Open5e) diretamente na borda (edge) através de num banco de dados SQLite globalmente replicado utilizando o [Azion Edge SQL](https://www.azion.com/pt-br/produtos/edge-sql/).

## Arquitetura & Trade-offs (Prós e Contras)

Durante a fase de planejamento desta API, foram tomadas decisões arquiteturais deliberadas focadas na computação serverless na borda.

### 1. Roteador Monolítico vs Micro-Funções (Micro-Functions)

**Decisão**: Um ponto de entrada único (`index.ts`) que roteia o tráfego internamente, em vez de fazer deploy de dezenas de funções isoladas na Azion para cada rota (`/monsters`, `/spells`, etc.).

**Trade-offs**:

- **Prós**: Reduz drasticamente os _cold starts_ (inicializações frias), pois qualquer requisição para a API mantém o Isolate do V8 aquecido para todas as outras rotas. Também centraliza os middlewares (como parsing de JSON e tratamento de erros) e reduz muito a complexidade de gerenciar dezenas de deploys pelo Azion CLI.
- **Contras**: O tamanho final do bundle (`.ts` transpilado) fica levemente maior do que o de uma função isolada de propósito único, embora o impacto seja nulo para uma engine V8.

### 2. Azion Edge SQL vs Azion KV Store (Chave-Valor)

**Decisão**: Utilização do Azion Edge SQL (SQLite Distribuído) no lugar do Azion KV Store (Armazenamento de Chave-Valor) para a camada de cache.

**Trade-offs**:

- **Prós**: **Flexibilidade na paginação.** Se um KV Store fosse utilizado, consultar uma página de magias (`/api/spells?page=2`) exigiria a criação de um cache da _resposta inteira daquela página_ como o valor da chave. Se a paginação mudasse ou o usuário inserisse um filtro (`?sort`), o cache da página quebraria. Com o Edge SQL, o cache é feito por **Entidade** (ex: `slug: acid-arrow_pt-br`). É possível montar consultas rápidas (`SELECT * WHERE slug IN (...)`), garantindo uma API robusta que se adapta dinamicamente às paginações da Open5e.
- **Contras**: A configuração e o gerenciamento de esquemas (schemas) em SQL exigem mais código inicial do que simples requisições `get`/`put` nativas de um banco de dados NoSQL Chave-Valor.

### 3. Traduções Assíncronas vs Síncronas

**Decisão**: As chamadas para a API de tradução de LLM do Hugging Face acontecem de forma _assíncrona_ (em background) em vez de bloquearem a requisição HTTP.

**Trade-offs**:

- **Prós**: Edge Functions possuem limites de tempo de execução (timeouts) muito rigorosos. Esperar um modelo de IA externo traduzir grandes blocos de JSON de forma síncrona invariavelmente levaria a erros `504 Gateway Timeout`. Ao retornar a lista não traduzida (ou parcialmente traduzida) imediatamente e despachar a tradução para segundo plano, a API principal se mantém extremamente veloz.
- **Contras**: O cliente (usuário/aplicação) precisará dar "refresh" ou fazer uma nova requisição alguns segundos depois para ver as traduções completas, assim que o background terminar de inseri-las no Edge SQL.

## Desenvolvimento

Este projeto utiliza o [pnpm](https://pnpm.io/) como gerenciador de pacotes. Caso não o possua, é possível instalá-lo globalmente via `npm install -g pnpm`.

Além disso, para fazer o deploy e gerenciar este projeto, é estritamente necessário ter a [Azion CLI](https://www.azion.com/pt-br/documentacao/produtos/azion-cli/visao-geral/) instalada e autenticada.
Para instalar o CLI oficial da Azion:

**Para macOS/Linux**:

```bash
curl -sSfL https://get.azion.com | sh
```

**Para Windows (via Winget)**:

```bash
winget install aziontech.azion
```

Após a instalação, faça o login na sua conta:

```bash
azion login
```

### Configuração

Instalar dependências:

```bash
pnpm install
```

Formatação e Linter:

```bash
pnpm format
pnpm lint
```

### Emulação Local

Você pode emular o ambiente do Azion Edge Functions localmente para testar alterações antes do deploy.

1. **Inicie o Emulador:**

   ```bash
   pnpm emulate
   ```

   Este comando executa um servidor local que emula o ambiente de Edge (`azion dev`).

2. **Teste a API Local:**
   Para atestar que a API está rodando localmente e testar o roteamento base chamando a Open5e com `/api/test`:
   ```bash
   curl http://localhost:3000/api/test?slug=fireball
   ```

Deploy para Azion (requer Azion CLI instalada):

```bash
pnpm deploy
```

## Licença

O código-fonte desta API é licenciado sob a **Licença MIT**.

O conteúdo servido por esta API (incluindo as traduções geradas por IA) é derivado do SRD da 5ª Edição e é licenciado sob a licença **Creative Commons Attribution 4.0 International (CC-BY 4.0)**, acompanhando a licença da API do Open5e.
