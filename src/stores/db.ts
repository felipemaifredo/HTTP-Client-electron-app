import Dexie, { Table } from "dexie"

export interface HttpRequest {
    id: string
    name: string
    method: string
    url: string
    headers: Record<string, string>
    params: Record<string, string>
    body: any
    createdAt: number
    lastResponse?: {
        status: number
        statusText: string
        data: any
        headers: any
        duration: number
        timestamp: number
    }
}

export interface Project {
    id: string
    name: string
    requests: HttpRequest[]
    environments?: {
        dev: Record<string, string>
        production: Record<string, string>
    }
}

export class MyDatabase extends Dexie {
    projects!: Table<Project>

    constructor() {
        super("HttpClientDB")
        this.version(1).stores({
            projects: "id, name", // Primary key and indexed props
        })
    }
}

export const db = new MyDatabase()
