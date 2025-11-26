import { db, Project, HttpRequest } from "./db"
import { v4 as uuidv4 } from "uuid"

export const projectsStore = {
    getAll: async () => {
        return await db.projects.toArray()
    },

    addProject: async (name: string) => {
        const project: Project = {
            id: uuidv4(),
            name,
            requests: [],
            environments: {
                dev: {},
                production: {}
            }
        }
        await db.projects.add(project)
        return project
    },

    deleteProject: async (id: string) => {
        await db.projects.delete(id)
    },

    updateProject: async (id: string, data: Partial<Project>) => {
        await db.projects.update(id, data)
    },

    addRequest: async (projectId: string, requestName: string) => {
        const project = await db.projects.get(projectId)
        if (!project) throw new Error("Project not found")

        const newRequest: HttpRequest = {
            id: uuidv4(),
            name: requestName,
            method: "GET",
            url: "",
            headers: {},
            params: {},
            body: null,
            createdAt: Date.now(),
        }

        project.requests.push(newRequest)
        await db.projects.put(project)
        return newRequest
    },

    updateRequest: async (projectId: string, request: HttpRequest) => {
        const project = await db.projects.get(projectId)
        if (!project) throw new Error("Project not found")

        const index = project.requests.findIndex((r) => r.id === request.id)
        if (index !== -1) {
            project.requests[index] = request
            await db.projects.put(project)
        }
    },

    deleteRequest: async (projectId: string, requestId: string) => {
        const project = await db.projects.get(projectId)
        if (!project) throw new Error("Project not found")

        project.requests = project.requests.filter((r) => r.id !== requestId)
        await db.projects.put(project)
    },

    duplicateRequest: async (projectId: string, requestId: string) => {
        const project = await db.projects.get(projectId)
        if (!project) throw new Error("Project not found")

        const originalRequest = project.requests.find((r) => r.id === requestId)
        if (!originalRequest) throw new Error("Request not found")

        const duplicatedRequest: HttpRequest = {
            ...originalRequest,
            id: uuidv4(),
            name: `${originalRequest.name} (Copy)`,
            createdAt: Date.now()
        }

        project.requests.push(duplicatedRequest)
        await db.projects.put(project)
        return duplicatedRequest
    },

    importProjects: async (projects: Project[]) => {
        // Generate new IDs for imported projects to avoid conflicts
        const projectsWithNewIds = projects.map(project => ({
            ...project,
            id: uuidv4(),
            requests: project.requests.map(req => ({
                ...req,
                id: uuidv4()
            }))
        }))

        await db.projects.bulkAdd(projectsWithNewIds)
    }
}
