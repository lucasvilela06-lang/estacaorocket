# ESTAÇÃO ROCKET STUDIO

O Studio é uma área administrativa separada da experiência infantil. A geração de imagens acontece no servidor, e a chave da OpenAI nunca é enviada ao navegador.

## 1. Configurar as variáveis na Vercel

No projeto conectado ao repositório, abra **Settings → Environment Variables** e adicione:

| Nome | Uso |
|---|---|
| `OPENAI_API_KEY` | Chave da API da OpenAI para gerar imagens |
| `ROCKET_STUDIO_PASSWORD` | Senha escolhida para entrar no Studio |
| `ROCKET_STUDIO_SESSION_SECRET` | Segredo aleatório com pelo menos 32 caracteres |
| `OPENAI_IMAGE_MODEL` | Opcional. Padrão: `gpt-image-2.6-sunburst` |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço do Supabase, somente no servidor |

Aplique as variáveis aos ambientes Production e Preview conforme a necessidade. Nunca coloque `OPENAI_API_KEY` ou `SUPABASE_SERVICE_ROLE_KEY` em arquivos públicos, no HTML ou em scripts do navegador. Depois de salvar variáveis, faça um novo deploy.

## 2. Preparar a biblioteca compartilhada

1. Crie um projeto Supabase.
2. No SQL Editor do Supabase, execute `supabase/migrations/20261106_coloring_artworks.sql`.
3. Copie a Project URL para `SUPABASE_URL`.
4. Copie a chave **service_role** para `SUPABASE_SERVICE_ROLE_KEY`, exclusivamente como variável de ambiente da Vercel.

O bucket `rocket-coloring` será público para leitura das imagens aprovadas. Escritas e publicações são feitas pela função de servidor, com a chave de serviço.

## 3. Acessar o Studio

Abra `/studio.html` no domínio do site e entre com `ROCKET_STUDIO_PASSWORD`.

## 4. Fluxo recomendado

1. Descreva a ilustração e escolha idade e complexidade.
2. Gere e revise a imagem.
3. Marque os quatro itens do checklist de qualidade.
4. Salve como rascunho ou publique na biblioteca compartilhada.
5. A biblioteca local fica no IndexedDB deste navegador. Para compartilhar uma ilustração entre dispositivos, use Publicar após configurar o Supabase.

## 5. Critérios de qualidade

A geração por IA não garante regiões perfeitamente fechadas. Antes de publicar, verifique contornos, áreas de preenchimento, legibilidade e adequação à faixa etária. A próxima etapa do motor de pintura é gerar e validar máscaras de regiões preenchíveis a partir do PNG original, mantendo o desenho original intacto como camada superior.

## Endpoints

- `POST /api/studio/auth` — valida senha e cria sessão protegida.
- `GET /api/studio/session` — consulta sessão e capacidades configuradas.
- `POST /api/studio/generate` — chama a OpenAI Images API.
- `POST /api/studio/publish` — envia PNG ao Supabase Storage e grava metadados.
- `GET /api/coloring/catalog` — retorna somente desenhos publicados.
- `POST /api/studio/logout` — encerra a sessão.
