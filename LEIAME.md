# Augmented Open5e (Open5e Aumentado)

<p align="left">
  <a href="README.md"><img src="https://flagcdn.com/w40/us.png" alt="English" width="22" style="opacity: 0.5;"></a>&nbsp;&nbsp;
  <a href="LEIAME.md"><img src="https://flagcdn.com/w40/br.png" alt="Português" width="32" style="opacity: 1;"></a>&nbsp;&nbsp;
  <a href="LEAME.md"><img src="https://flagcdn.com/w40/es.png" alt="Español" width="22" style="opacity: 0.5;"></a>
</p>

Uma API REST open-source (Licença MIT) deployada no **Azion Edge Functions** que atua como uma camada de "aumento" (augmentation) sobre a [API pública do Open5e](https://api.open5e.com/) para traduções automáticas feitas por IA.

Ela serve conteúdo do System Reference Document (SRD) de Dungeons & Dragons 5ª Edição e o estende automaticamente com traduções geradas por Inteligência Artificial (LLMs da Hugging Face) para diferentes idiomas.

> **⚠️ AVISO — Sobre Direitos Autorais:** Este projeto baseia-se inteiramente no SRD (System Reference Document) de D&D 5e, que é disponibilizado sob licença Creative Commons (CC-BY). **As traduções fornecidas por esta API são estritamente geradas por máquina (via IA/LLMs) sob demanda e NÃO SÃO traduções oficiais.** Este projeto não é afiliado, endossado ou criado com o intuito de reproduzir as obras traduzidas protegidas por direitos autorais da Wizards of the Coast ou de qualquer um de seus parceiros locais de publicação.

## Valor Real e Caso de Uso

O principal caso de uso desta API **não é** substituir a API do Open5e, mas sim complementá-la. Um cliente (aplicação) pode perfeitamente usar o Open5e diretamente para processos de busca (search) e paginação (que é um caso de uso distinto, com sua própria UX), e utilizar esta API apenas como uma camada de tradução rápida através do `slug`.

As traduções serão incrivelmente rápidas justamente porque rodam no edge e são cacheadas globalmente — garantindo baixa latência após o primeiro acesso.

**Exemplo Concreto:** Uma UI de grimório ou ficha de personagem que exibe magias traduzidas automaticamente para o idioma do usuário. O cliente busca a magia na Open5e, pega o slug, e chama esta API para obter a tradução — sem precisar gerenciar nenhuma infraestrutura de tradução própria.

## Limitações Atuais

Atualmente, a API suporta apenas a **busca individual de magias por slug**. Quaisquer endpoints relacionados a search (busca aberta), paginação ou operações em bulk (massa) não existem e não são suportados.

**Por quê?** O modelo de edge computing (executado em V8 isolates) possui limites rígidos de tempo de execução e não é adequado para processamento em massa de longa duração ou grandes orquestrações. Essas operações pertencem a um cloud worker tradicional consumindo uma fila de mensagens, não ao edge.

## Arquitetura e Roadmap

A arquitetura planejada para a próxima iteração do projeto separa claramente a entrega rápida do processamento pesado:

1. **A Edge Function** serve os resultados cacheados e retorna o status `202 Accepted` para conteúdos que ainda não foram traduzidos.
2. **Um Cloud Worker** (ex: Cloud Run, Lambda) consome uma fila de mensagens (ex: SQS, Pub/Sub) e processa as traduções em bulk de forma assíncrona.
3. **O Edge SQL** permanece como um cache de leitura rápida no "hot path" (caminho crítico de latência).

Essa separação respeita o ponto forte do edge (servir conteúdo com latência ultrabaixa) sem abusar da plataforma para workloads para os quais ela não foi projetada.

Além disso, o endpoint de descoberta `GET /api/spells?locale=<locale>` poderá, no futuro (como uma possibilidade ou contribuição da comunidade), disparar automaticamente o job de tradução em background quando um locale for consultado sem nenhuma magia em cache — tornando-o o ponto de entrada natural para iniciar o "aquecimento do cache" (cache warming) de um novo idioma.

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

   Isto abrirá automaticamente o seu navegador padrão em `http://localhost:3333/docs` de onde você poderá visualizar a especificação e testar os endpoints diretamente pela UI.

#### Emulador Local — Observações de Comportamento

**Formato de locale:** O parâmetro `locale` deve sempre seguir o formato `idioma-região` (`pt-br`, `en-us`, `es-es`). Códigos simples como `pt` ou `en` são rejeitados com HTTP 400.

**KV Storage em disco:** Ao rodar localmente, o emulador da Azion persiste os dados de KV em `.edge/storage/<nome-do-bucket>/` dentro da raiz do projeto. Cada chave de cache é armazenada como um arquivo separado. Para resetar o cache local, basta apagar os arquivos desse diretório:

```bash
rm .edge/storage/augmented_spells_kv-staging/*
```

**Mock de tradução por IA:** O emulador local **não** chama o endpoint real de inferência de IA da Azion. Em vez disso, quando a variável de ambiente `MOCK_AI_LATENCY` está definida (o que o `pnpm emulate` faz automaticamente), as traduções retornam um texto de placeholder (`"[la-LA] Nome"` para nomes e um parágrafo de Lorem Ipsum para descrições). Isso permite verificar todo o fluxo de requisição, cache e job em background sem consumir cota de IA.

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
