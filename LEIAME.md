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

- **Prós**: **Flexibilidade na paginação.** Se um KV Store fosse utilizado, consultar uma lista paginada de magias (`/api/spells?page=2`) exigiria o cache da _resposta inteira da página como uma única string_. Se o usuário posteriormente adicionar um filtro ou alterar o tamanho da página, o cache da página é quebrado. Com o Edge SQL, as traduções são cacheadas em **Nível de Entidade** (ex: `slug: acid-arrow_pt-br`). Um comando rápido `SELECT * WHERE slug IN (...)` pode ser executado, permitindo consultas de API dinâmicas e robustas que se adaptam a quaisquer variações nas listas.
- **Contras**: O armazenamento em SQL requer um pouco mais de configuração inicial em comparação com os comandos simples de `get`/`put` em um KV store.

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
curl -fsSL https://cli.azion.app/install.sh | bash
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

### Desenvolvimento e Testes

#### Testes Unitários (Unit Tests)

Utilizamos Vitest para os testes unitários. Para executar a suite de testes:

```bash
pnpm test
```

#### Emulação Local e Documentação

Você pode emular o ambiente do Azion Edge Functions localmente para testar alterações através de uma interface interativa Scalar antes de fazer o deploy.

1. **Inicie o Emulador:**

   Em um primeiro terminal, execute:

   ```bash
   pnpm emulate
   ```

   Este comando executa um servidor local que emula o ambiente de Edge (`azion dev`).

2. **Abra a Documentação da API:**

   Em um segundo terminal, execute:

   ```bash
   pnpm open
   ```

3. **Inicie o Emulador:**

   Em um primeiro terminal, execute:

   ```bash
   pnpm emulate
   ```

   Este comando executa um servidor local que emula o ambiente de Edge (`azion dev`).

4. **Abra a Documentação da API:**

   Em um segundo terminal, execute:

   ```bash
   pnpm open
   ```

   Isto abrirá automaticamente o seu navegador padrão em `http://localhost:3333/docs` de onde você poderá visualizar a especificação e testar os endpoints diretamente pela UI.

### Estratégia de Deploy

Este projeto usa uma configuração de duplo-ambiente (Staging e Produção) definida em `azion.config.ts`. Os recursos criados na Azion recebem automaticamente o sufixo `-staging` ou `-prod`.

Os arquivos de estado `azion.json` (em `azion/staging/` e `azion/production/`) **são commitados no repositório** para garantir a consistência do deploy entre diferentes ambientes e pipelines de CI/CD.

#### 1. Configuração para Novos Colaboradores

Caso tenha acabado de clonar o repositório e precise autorizar seus próprios recursos de aplicação na Azion, execute o comando de reset:

```bash
pnpm reset
```

Isto gera os arquivos `azion.json` básicos. Seu primeiro `pnpm deploy` criará os recursos e atualizará estes arquivos com os novos IDs.

#### 2. Deploy de Staging (local)

```bash
pnpm deploy:staging
```

Faz o build e o deploy da edge function no namespace `augmentedopen5e-staging`. Na primeira execução (após o `pnpm reset`), o CLI cria os recursos; nas subsequentes, ele os atualiza utilizando os IDs armazenados no `azion.json`.

#### 3. Deploy de Produção (local ou GitHub Actions)

```bash
pnpm deploy:prod
```

Faz o build e o deploy no namespace `augmentedopen5e-prod`. Ele utiliza os IDs commitados no repositório para garantir que sempre atualize a aplicação correta.

> **Importante para Forks:**
>
> 1. Crie um Personal Token no seu console da Azion.
> 2. No seu repositório GitHub, acesse **Settings → Secrets and variables → Actions** e adicione um secret chamado `AZION_PERSONAL_TOKEN` com o valor do token.

## Licença

O código-fonte desta API é licenciado sob a **Licença MIT**.

O conteúdo servido por esta API (incluindo as traduções geradas por IA) é derivado do SRD da 5ª Edição e é licenciado sob a licença **Creative Commons Attribution 4.0 International (CC-BY 4.0)**, acompanhando a licença da API do Open5e.
