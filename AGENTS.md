# ROCKET DEV — Estação Rocket

## Missão e autonomia

ROCKET DEV pode inspecionar o código, implementar mudanças, executar validações,
criar commits, branches e pull requests. Trabalhe de forma incremental e deixe um
resumo com os arquivos alterados e as validações executadas. Nunca faça merge de
pull request nem deploy em produção sem aprovação explícita do usuário.

## Arquitetura do repositório

- `estacao-rocket-preview/` é a raiz da aplicação publicada.
- As páginas e a experiência infantil são HTML, CSS e JavaScript sem framework e
  sem etapa de build.
- `estacao-rocket-preview/api/` contém funções serverless com runtime Node.
- `estacao-rocket-preview/lib/` concentra autenticação e acesso server-side ao
  Supabase.
- `estacao-rocket-preview/supabase/migrations/` contém SQL para execução manual
  no Supabase; não é executado automaticamente.
- `STUDIO-SETUP.md` é a referência operacional do Studio.

## Ambiente e comandos seguros

- Use Node.js 22 LTS ou versão compatível com as funções serverless.
- Não há `package.json`, lockfile, gerenciador de pacotes configurado, scripts de
  `build`, `lint` ou testes automatizados. Não introduza dependências, manifestos
  ou um framework sem necessidade explícita.
- Validação mínima de JavaScript (quando Node estiver disponível):

  ```sh
  find estacao-rocket-preview -type f -name '*.js' -not -path '*/node_modules/*' -print0 | xargs -0 -n1 node --check
  ```

- Para uma prévia estática, use uma porta não privilegiada, por exemplo:

  ```sh
  npx --yes serve estacao-rocket-preview -l 3000
  ```

  Essa prévia não executa as rotas em `api/`. Só use um ambiente Vercel de
  desenvolvimento quando houver configuração e acesso aprovados para isso.

## Segredos e configurações

- Nunca mostre, grave no repositório, emita em logs, ou copie valores de segredos.
- As variáveis usadas pelo Studio são: `OPENAI_API_KEY`,
  `ROCKET_STUDIO_PASSWORD`, `ROCKET_STUDIO_SESSION_SECRET`,
  `OPENAI_IMAGE_MODEL` (opcional), `SUPABASE_URL` e
  `SUPABASE_SECRET_KEY` (ou o fallback legado `SUPABASE_SERVICE_ROLE_KEY`).
- Solicite valores ausentes ao usuário; nunca os invente. Use segredos gerenciados
  pelo ambiente, com o menor escopo possível.
- Não altere segredos, permissões, conexões, domínios permitidos ou configurações
  de produção sem aprovação explícita.

## Ações que exigem aprovação explícita

Antes de executar, aguarde autorização do usuário para:

- executar, criar, editar ou aplicar migrações SQL/Supabase, ou operações que
  alterem dados, Storage, buckets, políticas/RLS ou esquemas;
- apagar ou sobrescrever dados, arquivos publicados ou recursos remotos;
- alterar segredos, credenciais, permissões, identidades, integrações ou rede;
- publicar conteúdo compartilhado pelo Studio, fazer deploy, promover Preview
  para Production, ou alterar configurações da Vercel/Supabase;
- fazer merge, rebase forçado, push forçado ou qualquer ação irreversível/de alto
  impacto.

## Fluxo de trabalho

1. Leia o código afetado e `STUDIO-SETUP.md` antes de modificar integrações.
2. Faça mudanças pequenas e preserve o comportamento infantil e administrativo.
3. Execute a validação sintática aplicável e informe limitações de cobertura.
4. Use uma branch descritiva para mudanças. É permitido abrir PR, mas nunca
   realizar merge sem aprovação explícita.
5. Ao finalizar, informe riscos, validações, variáveis necessárias e quaisquer
   passos manuais restantes.
