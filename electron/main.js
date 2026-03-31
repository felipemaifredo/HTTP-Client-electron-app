const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron")
const path = require("path")
const fs = require("fs")
const axios = require("axios")

function createWindow() {
    const isMac = process.platform === "darwin"
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: !isMac, // Frameless window on Windows/Linux
        titleBarStyle: isMac ? "hiddenInset" : "default",
        autoHideMenuBar: true, // Hide menu bar
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    })

    const isDev = !app.isPackaged
    if (isDev) {
        mainWindow.loadURL("http://localhost:5173")
        //mainWindow.webContents.openDevTools()
    } else {
        mainWindow.loadFile(path.join(__dirname, "../dist/index.html"))
    }


}

app.whenReady().then(() => {
    createWindow()

    app.on("activate", function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on("window-all-closed", function () {
    if (process.platform !== "darwin") app.quit()
})

// IPC Handlers

// Window Controls
ipcMain.handle("window:minimize", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.minimize()
})

ipcMain.handle("window:maximize", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
        if (win.isMaximized()) {
            win.unmaximize()
        } else {
            win.maximize()
        }
    }
})

ipcMain.handle("window:close", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.close()
})

// HTTP Request
ipcMain.handle("http:request", async (event, config) => {
    try {
        if (!config.headers) {
            config.headers = {}
        }
        config.headers["User-Agent"] = "Plincthet"

        const response = await axios(config)
        return {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data,
        }
    } catch (error) {
        return {
            error: error.message,
            status: error.response ? error.response.status : undefined,
            statusText: error.response ? error.response.statusText : undefined,
            headers: error.response ? error.response.headers : undefined,
            data: error.response ? error.response.data : undefined,
        }
    }
})

// File System
ipcMain.handle("fs:save-projects", async (event, data) => {
    const { filePath } = await dialog.showSaveDialog({
        filters: [{ name: "JSON", extensions: ["json"] }],
    })

    if (filePath) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
        return { success: true, filePath }
    }
    return { canceled: true }
})

ipcMain.handle("fs:load-projects", async () => {
    const { filePaths } = await dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "JSON", extensions: ["json"] }],
    })

    if (filePaths && filePaths.length > 0) {
        const content = fs.readFileSync(filePaths[0], "utf-8")
        return { success: true, data: JSON.parse(content) }
    }
    return { canceled: true }
})

// Shell
ipcMain.handle("shell:open", async (event, url) => {
    await shell.openExternal(url)
})
