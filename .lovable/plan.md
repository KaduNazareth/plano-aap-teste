

## Adicionar Screenshots Reais ao Manual do Usuario

### Resumo
Adicionar imagens reais de cada tela do sistema ao Manual do Usuario, tornando-o mais visual e ilustrativo. As screenshots serao salvas como arquivos estaticos na pasta `public/manual/` e referenciadas no componente da pagina.

### O que sera feito

**1. Capturar screenshots de todas as telas**

Usando o navegador integrado, vou capturar prints de cada modulo do sistema com as credenciais de teste ja fornecidas. As imagens serao salvas em `public/manual/`:

| Arquivo | Tela |
|---------|------|
| `screenshot-login.png` | Tela de login |
| `screenshot-dashboard.png` | Dashboard / Painel Principal |
| `screenshot-programacao.png` | Programacao |
| `screenshot-registrar-acao.png` | Formulario de registro de acao |
| `screenshot-registros.png` | Historico de registros |
| `screenshot-escolas.png` | Escolas / Regional / Rede |
| `screenshot-professores.png` | Professores / Coordenadores |
| `screenshot-aaps.png` | AAPs / Formadores |
| `screenshot-evolucao.png` | Evolucao do Professor |
| `screenshot-relatorios.png` | Relatorios |
| `screenshot-lista-presenca.png` | Lista de Presenca |
| `screenshot-historico-presenca.png` | Historico de Presenca |
| `screenshot-usuarios.png` | Gestao de Usuarios |
| `screenshot-pendencias.png` | Pendencias |
| `screenshot-perfil.png` | Perfil do Usuario |

**2. Atualizar `ManualUsuarioPage.tsx`**

- Adicionar campo `screenshot` na interface `ManualSection` com o caminho da imagem
- Cada secao exibira a screenshot abaixo do titulo/descricao, dentro de um container com borda arredondada e sombra leve
- A imagem tera estilo `max-width: 100%` com borda e border-radius para parecer uma janela de aplicativo
- No PDF exportado, as imagens serao capturadas junto pelo html2canvas, mantendo a fidelidade visual

### Resultado esperado

Cada secao do manual tera:
1. Icone + titulo do modulo
2. Descricao textual de como usar
3. Screenshot real da tela correspondente (com borda/sombra)
4. Dicas de uso

O PDF exportado incluira todas as screenshots, gerando um documento completo e visualmente rico.

### Detalhes tecnicos

- As imagens ficam em `public/manual/` como assets estaticos (sem banco de dados)
- Referenciadas via caminho `/manual/screenshot-xxx.png` no JSX
- O `html2canvas` ja esta configurado com `useCORS: true`, entao capturara as imagens corretamente no PDF
- Cada card de secao tera `pageBreakInside: 'avoid'` para evitar cortes no meio de uma secao no PDF
- As imagens terao tamanho controlado para nao estourar o layout A4

