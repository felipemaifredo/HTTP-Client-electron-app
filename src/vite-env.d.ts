/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface HttpRequest {
    id: string;
    name: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    params: Record<string, string>;
    body: string | null;
    createdAt: number;
}

interface Project {
    id: string;
    name: string;
    requests: HttpRequest[];
}

interface ElectronApi {
    runHttpRequest: (config: any) => Promise<any>;
    saveProjects: (data: Project[]) => Promise<{ success?: boolean; filePath?: string; canceled?: boolean }>;
    loadProjects: () => Promise<{ success?: boolean; data?: Project[]; canceled?: boolean }>;
    openDialog: () => Promise<any>;
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
}

interface Window {
    api: ElectronApi;
}
