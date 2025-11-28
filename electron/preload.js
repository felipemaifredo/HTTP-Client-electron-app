const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("api", {
    runHttpRequest: (config) => ipcRenderer.invoke("http:request", config),
    saveProjects: (data) => ipcRenderer.invoke("fs:save-projects", data),
    loadProjects: () => ipcRenderer.invoke("fs:load-projects"),
    openDialog: () => ipcRenderer.invoke("dialog:open"),

    // Window Controls
    minimize: () => ipcRenderer.invoke("window:minimize"),
    maximize: () => ipcRenderer.invoke("window:maximize"),
    close: () => ipcRenderer.invoke("window:close"),

    // Shell
    openExternal: (url) => ipcRenderer.invoke("shell:open", url),
})
