# 🎨 Alest Agent ElevenLabs - Frontend

> Interface React moderna para configuração e interação com agentes conversacionais ElevenLabs, desenvolvida pela equipe Alest.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Desenvolvimento](#desenvolvimento)
- [Build e Deploy](#build-e-deploy)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Funcionalidades](#funcionalidades)
- [Configuração](#configuração)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Testes](#testes)
- [Contribuição](#contribuição)
- [Licença](#licença)

## 🚀 Sobre o Projeto

Este projeto é uma interface web moderna desenvolvida em React para interação com agentes conversacionais da ElevenLabs. A aplicação oferece uma experiência de usuário intuitiva para configuração de agentes, chat em tempo real e gerenciamento de configurações MCP (Model Context Protocol).

### Principais Características

- **Interface Conversacional**: Chat moderno e responsivo
- **Configuração Dinâmica**: Ajustes de agente em tempo real
- **Design System**: Componentes reutilizáveis com Tailwind CSS
- **Performance Otimizada**: Lazy loading e code splitting
- **Acessibilidade**: Seguindo padrões WCAG
- **Mobile First**: Design responsivo para todos os dispositivos

## 🛠️ Tecnologias

### Core
- **[React 19](https://react.dev/)** - Framework frontend
- **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática
- **[Vite](https://vitejs.dev/)** - Build tool e dev server

### Styling & UI
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS utilitário
- **[Tailwind Forms](https://github.com/tailwindlabs/tailwindcss-forms)** - Estilos para formulários
- **[Lucide React](https://lucide.dev/)** - Biblioteca de ícones

### Integração
- **[@elevenlabs/react](https://www.npmjs.com/package/@elevenlabs/react)** - SDK oficial ElevenLabs

### Qualidade de Código
- **[ESLint](https://eslint.org/)** - Linting JavaScript/TypeScript
- **[Prettier](https://prettier.io/)** - Formatação de código
- **[Husky](https://typicode.github.io/husky/)** - Git hooks
- **[lint-staged](https://github.com/okonet/lint-staged)** - Lint em arquivos staged

### Testes
- **[Playwright](https://playwright.dev/)** - Testes E2E
- **[@playwright/experimental-ct-react](https://playwright.dev/docs/test-components)** - Component testing

### Build & Deploy
- **[Terser](https://terser.org/)** - Minificação JavaScript
- **[rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer)** - Análise de bundle

## 📋 Pré-requisitos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 ou **yarn** >= 1.22.0
- **Git** para controle de versão

## 🔧 Instalação

1. **Clone o repositório**
   ```bash
   git clone <repository-url>
   cd alest-agent-elevenlabs
   ```

2. **Navegue para a pasta da aplicação**
   ```bash
   cd app
   ```

3. **Instale as dependências**
   ```bash
   npm install
   ```

4. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env
   ```
   
   Edite o arquivo `.env` com suas configurações:
   ```env
   VITE_ELEVENLABS_AGENT_ID=your_agent_id_here
   ```

## 🏗️ Desenvolvimento

### Iniciar servidor de desenvolvimento
```bash
# Certifique-se de estar na pasta app/
cd app
npm run dev
```
A aplicação estará disponível em `http://localhost:5174`

### Comandos úteis durante desenvolvimento
```bash
# Verificar linting
npm run lint

# Formatar código
npm run format

# Executar testes E2E
npm run test:e2e

# Executar testes E2E com interface
npm run test:e2e:headed
```

## 📦 Build e Deploy

### Build para produção
```bash
# Certifique-se de estar na pasta app/
cd app
npm run build
```

### Preview do build
```bash
npm run preview
```

### Análise do bundle
Após o build, o arquivo `dist/stats.html` conterá a análise detalhada do bundle.

## 📂 Estrutura do Projeto

```
app/
├── public/                   # Assets estáticos
│   ├── alest-logo.png
│   └── logo-alest-raposa.png
├── src/
│   ├── components/           # Componentes React
│   │   ├── Header.tsx        # Cabeçalho da aplicação
│   │   ├── Home.tsx          # Tela principal com chat
│   │   ├── Chat/             # Componentes do chat
│   │   └── Sidebar/          # Componentes do menu lateral
│   ├── assets/               # Assets do código
│   ├── types/                # Definições TypeScript
│   ├── App.tsx               # Componente raiz
│   ├── main.tsx              # Entry point
│   └── index.css             # Estilos globais
├── dist/                     # Build de produção
├── test-results/             # Resultados dos testes
├── playwright-report/        # Relatórios Playwright
├── .env.example              # Exemplo de variáveis de ambiente
├── .gitignore                # Arquivos ignorados pelo Git
├── package.json              # Dependências e scripts
├── tailwind.config.js        # Configuração Tailwind
├── vite.config.ts            # Configuração Vite
└── README.md                 # Este arquivo
```

### Aliases de Path
O projeto utiliza aliases para imports mais limpos:
- `@components` → `src/components`
- `@assets` → `src/assets`
- `@styles` → `src/styles`
- `@utils` → `src/utils`
- `@types` → `src/types`
- `@hooks` → `src/hooks`
- `@services` → `src/services`

## 🎯 Funcionalidades

- ✅ **Interface de Chat**: Chat moderno e responsivo com suporte a mensagens em tempo real
- ✅ **Configuração de Agente**: Ajustes dinâmicos de configuração do agente ElevenLabs
- ✅ **Menu Lateral**: Sidebar com configurações e opções avançadas
- ✅ **Estados Visuais**: Indicadores visuais para conversas ativas e status do sistema
- ✅ **Design Responsivo**: Interface adaptável para desktop, tablet e mobile
- ✅ **Lazy Loading**: Carregamento otimizado de componentes
- ✅ **Configuração MCP**: Gerenciamento de Model Context Protocol
- ✅ **Tema Personalizado**: Design system com cores da marca Alest

## 🔧 Configuração

### Variáveis de Ambiente

O projeto utiliza variáveis de ambiente para configuração. Crie um arquivo `.env` baseado no `.env.example`:

```env
# ElevenLabs Configuration
VITE_ELEVENLABS_AGENT_ID=your_agent_id_here

# Adicione outras variáveis conforme necessário
# VITE_API_BASE_URL=https://api.example.com
# VITE_DEBUG_MODE=false
```

### Customização de Tema

O projeto utiliza um tema personalizado com as cores da marca Alest, definidas no `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      'alest-blue': '#1e40af',
      'alest-dark': '#1e293b',
      'alest-light': '#f8fafc',
    }
  }
}
```

### Configuração do Vite

O projeto está configurado com:
- **Port**: 5174 (desenvolvimento)
- **HMR**: Desabilitado para melhor performance
- **Aliases**: Paths absolutos para imports limpos
- **Bundle Analysis**: Geração automática de relatório de bundle
- **Otimizações**: Minificação com Terser e tree-shaking

## 📜 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento na porta 5174 |
| `npm run build` | Gera build otimizado para produção |
| `npm run preview` | Visualiza o build de produção localmente |
| `npm run lint` | Executa ESLint para verificar qualidade do código |
| `npm run format` | Formata código com Prettier |
| `npm run test:e2e` | Executa testes E2E com Playwright |
| `npm run test:e2e:headed` | Executa testes E2E com interface gráfica |
| `npm run test:e2e:update` | Atualiza snapshots dos testes visuais |
| `npm run start` | Inicia aplicação na porta 3001 |

## 🧪 Testes

### Testes End-to-End (E2E)

O projeto utiliza **Playwright** para testes E2E e testes de componentes:

```bash
# Executar todos os testes E2E
npm run test:e2e

# Executar testes com interface gráfica
npm run test:e2e:headed

# Atualizar snapshots visuais
npm run test:e2e:update
```

### Estrutura de Testes

```
tests/
├── e2e/                      # Testes end-to-end
├── components/               # Testes de componentes
└── fixtures/                 # Dados de teste
```

### Relatórios

Após executar os testes, os relatórios estarão disponíveis em:
- `test-results/` - Resultados detalhados
- `playwright-report/` - Relatório HTML interativo

## 🤝 Contribuição

### Fluxo de Desenvolvimento

1. **Fork** o projeto
2. **Clone** seu fork localmente
3. **Crie** uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
4. **Commit** suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
5. **Push** para a branch (`git push origin feature/nova-funcionalidade`)
6. **Abra** um Pull Request

### Padrões de Código

- **Commits**: Seguir [Conventional Commits](https://www.conventionalcommits.org/)
- **Código**: ESLint + Prettier configurados
- **TypeScript**: Tipagem estrita habilitada
- **Testes**: Cobertura mínima para novas funcionalidades

### Pre-commit Hooks

O projeto utiliza Husky para executar verificações antes do commit:
- Lint do código alterado
- Formatação automática
- Verificação de tipos TypeScript

## 🚀 Deploy

### Build de Produção

```bash
# Gerar build otimizado
npm run build

# Verificar build localmente
npm run preview
```

### Otimizações Incluídas

- **Code Splitting**: Divisão automática do código
- **Tree Shaking**: Remoção de código não utilizado
- **Minificação**: Compressão com Terser
- **Asset Optimization**: Otimização de imagens e assets
- **Bundle Analysis**: Relatório detalhado em `dist/stats.html`

### Variáveis de Produção

Configure as seguintes variáveis no ambiente de produção:

```env
VITE_ELEVENLABS_AGENT_ID=production_agent_id
VITE_API_BASE_URL=https://api.production.com
```

## 📊 Performance

### Métricas Alvo

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

### Otimizações Implementadas

- Lazy loading de componentes
- Code splitting por rotas
- Otimização de imagens
- Caching de assets
- Bundle size otimizado (< 300KB warning)

## 🔒 Segurança

- **HTTPS**: Obrigatório em produção
- **Environment Variables**: Secrets não commitados
- **Dependencies**: Auditoria regular com `npm audit`
- **CSP**: Content Security Policy configurado
- **CORS**: Configuração restritiva

## 📝 Licença

Este projeto é propriedade da **Alest** e está sob licença proprietária. Todos os direitos reservados.

---

## 📞 Suporte

Para dúvidas ou suporte técnico, entre em contato com a equipe de desenvolvimento Alest.

**Desenvolvido com ❤️ pela equipe Alest**
