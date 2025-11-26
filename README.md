# HTTP Client - Electron App

Um cliente HTTP moderno construído com Electron, React e CSS Modules.

## Requisitos

- Node.js 16+
- npm

## Instalação

```bash
npm install
```

## Desenvolvimento

Execute o aplicativo em modo de desenvolvimento:

```bash
npm run dev
```

## Build

Compile o código TypeScript e construa os assets:

```bash
npm run build
```

## Gerar Instalador

### Todas as plataformas
Para gerar o executável de instalação para a plataforma atual:

```bash
npm run make
```

### Específico por plataforma

**Linux:**
```bash
npm run make:linux
```

**Windows:**
```bash
npm run make:win
```

**macOS:**
```bash
npm run make:mac
```

### Saída

Os instaladores serão gerados na pasta `dist-installer/`:

- **Windows**: `http-client-electron Setup 1.0.0.exe` (NSIS installer)
- **macOS**: `http-client-electron-1.0.0.dmg`
- **Linux**: `http-client-electron-1.0.0.AppImage`

> **Nota sobre Cross-Platform Build**: 
> - **No Windows**: Você pode gerar instaladores para Windows (`.exe`). Para Linux/Mac, você precisaria usar WSL2 ou Docker.
> - **No Linux**: Você pode gerar AppImage para Linux. Para Windows, precisa do Wine. Para Mac, precisa rodar no macOS.
> - **No macOS**: Você pode gerar para todas as plataformas (com ferramentas adequadas instaladas).
>
> **Recomendação**: Para gerar o instalador Linux, use WSL2 (Windows Subsystem for Linux) ou rode o comando em uma máquina Linux real.

## Estrutura do Projeto

```
├── electron/           # Processo principal do Electron
│   ├── main.js        # Ponto de entrada
│   └── preload.js     # Script de preload
├── src/
│   ├── components/    # Componentes React
│   │   ├── *.tsx      # Componentes
│   │   └── *.module.css  # CSS Modules
│   ├── stores/        # Dexie DB
│   ├── services/      # HTTP client
│   ├── utils/         # Utilitários
│   ├── App.tsx        # Componente principal
│   └── index.css      # Estilos globais
└── dist/              # Build de produção
```

## Funcionalidades

- ✅ Gerenciamento de projetos
- ✅ Criação e edição de requisições HTTP
- ✅ Suporte para GET, POST, PUT, DELETE, PATCH
- ✅ Persistência local com IndexedDB
- ✅ Import/Export de projetos (JSON)
- ✅ Tema claro/escuro
- ✅ Janela customizada sem frame
- ✅ CSS Modules para estilização
- ✅ Modais customizados (sem bug de foco)

## Tecnologias

- **Electron** - Framework desktop
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Dexie** - IndexedDB wrapper
- **Axios** - HTTP client
- **CSS Modules** - Component styling
- **electron-builder** - Package and build
