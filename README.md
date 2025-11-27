# HTTP Client - Electron App

A modern HTTP Client built with Electron, React, and CSS Modules.

## Requirements

- Node.js 16+
- npm

## Installation

```bash
npm install
```

## Development

Run the application in development mode:

```bash
npm run dev
```

## Build

Compile TypeScript code and build assets:

```bash
npm run build
```

## Generate Installer

### All Platforms
To generate the installer executable for the current platform:

```bash
npm run make
```

### Platform Specific

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

### Output

Installers will be generated in the `dist-installer/` folder:

- **Windows**: `http-client-electron Setup 1.0.0.exe` (NSIS installer)
- **macOS**: `http-client-electron-1.0.0.dmg`
- **Linux**: `http-client-electron-1.0.0.AppImage`

> **Cross-Platform Build Note**:
> - **On Windows**: You can generate installers for Windows (`.exe`). For Linux/Mac, you would need to use WSL2 or Docker.
> - **On Linux**: You can generate AppImage for Linux. For Windows, you need Wine. For Mac, you need to run on macOS.
> - **On macOS**: You can generate for all platforms (with appropriate tools installed).
>
> **Recommendation**: To generate the Linux installer, use WSL2 (Windows Subsystem for Linux) or run the command on a real Linux machine.

## Project Structure

```
├── electron/           # Electron main process
│   ├── main.js        # Entry point
│   └── preload.js     # Preload script
├── src/
│   ├── components/    # React components
│   │   ├── *.tsx      # Components
│   │   └── *.module.css  # CSS Modules
│   ├── stores/        # Dexie DB
│   ├── services/      # HTTP client
│   ├── utils/         # Utilities
│   ├── App.tsx        # Main component
│   └── index.css      # Global styles
└── dist/              # Production build
```

## Features

- ✅ Project management
- ✅ Create and edit HTTP requests
- ✅ Support for GET, POST, PUT, DELETE, PATCH
- ✅ Local persistence with IndexedDB
- ✅ Import/Export projects (JSON)
- ✅ Light/Dark theme
- ✅ CSS Modules for styling
- ✅ Custom modals (no focus bug)
- ✅ **Generate Types from Response** (New!)
- ✅ **Inline Folder Renaming** (New!)

## Offline & Privacy

This application is designed with an **Offline-First** focus.

- **No User Data Collection**: No user data is sent to any external server. All your requests and projects are stored locally on your machine using IndexedDB.
- **Update Check**: The application only makes a single `GET` request to check for application updates. No personal or usage data is transmitted during this process.

## Technologies

- **Electron** - Desktop framework
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Dexie** - IndexedDB wrapper
- **Axios** - HTTP client
- **CSS Modules** - Component styling
- **electron-builder** - Package and build
