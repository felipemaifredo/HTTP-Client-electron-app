import { db, Project, HttpRequest, Folder } from "./db"
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
            folders: [],
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

    addFolder: async (projectId: string, name: string) => {
        const project = await db.projects.get(projectId)
        if (!project) throw new Error("Project not found")

        if (!project.folders) {
            project.folders = []
        }

        const newFolder: Folder = {
            id: uuidv4(),
            name,
            requests: [],
            isOpen: true
        }

        project.folders.push(newFolder)
        await db.projects.put(project)
        return newFolder
    },

    deleteFolder: async (projectId: string, folderId: string) => {
        const project = await db.projects.get(projectId)
        if (!project) throw new Error("Project not found")

        if (project.folders) {
            project.folders = project.folders.filter(f => f.id !== folderId)
            await db.projects.put(project)
        }
    },

    toggleFolder: async (projectId: string, folderId: string, isOpen: boolean) => {
        const project = await db.projects.get(projectId)
        if (!project) throw new Error("Project not found")

        if (project.folders) {
            const folder = project.folders.find(f => f.id === folderId)
            if (folder) {
                folder.isOpen = isOpen
                await db.projects.put(project)
            }
        }
    },

    renameFolder: async (projectId: string, folderId: string, newName: string) => {
        const project = await db.projects.get(projectId)
        if (!project) throw new Error("Project not found")

        if (project.folders) {
            const folder = project.folders.find(f => f.id === folderId)
            if (folder) {
                folder.name = newName
                await db.projects.put(project)
            }
        }
    },

    addRequest: async (projectId: string, requestName: string, folderId?: string) => {
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

        if (folderId) {
            if (!project.folders) project.folders = []
            const folder = project.folders.find(f => f.id === folderId)
            if (folder) {
                folder.requests.push(newRequest)
            } else {
                // Fallback to root if folder not found
                project.requests.push(newRequest)
            }
        } else {
            project.requests.push(newRequest)
        }

        await db.projects.put(project)
        return newRequest
    },

    updateRequest: async (projectId: string, request: HttpRequest) => {
        const project = await db.projects.get(projectId)
        if (!project) throw new Error("Project not found")

        // Check root requests
        const index = project.requests.findIndex((r) => r.id === request.id)
        if (index !== -1) {
            project.requests[index] = request
            await db.projects.put(project)
            return
        }

        // Check folders
        if (project.folders) {
            for (const folder of project.folders) {
                const folderIndex = folder.requests.findIndex((r) => r.id === request.id)
                if (folderIndex !== -1) {
                    folder.requests[folderIndex] = request
                    await db.projects.put(project)
                    return
                }
            }
        }
    },

    deleteRequest: async (projectId: string, requestId: string) => {
        const project = await db.projects.get(projectId)
        if (!project) throw new Error("Project not found")

        // Try deleting from root
        const originalLength = project.requests.length
        project.requests = project.requests.filter((r) => r.id !== requestId)

        if (project.requests.length !== originalLength) {
            await db.projects.put(project)
            return
        }

        // Try deleting from folders
        if (project.folders) {
            let changed = false
            for (const folder of project.folders) {
                const folderLen = folder.requests.length
                folder.requests = folder.requests.filter((r) => r.id !== requestId)
                if (folder.requests.length !== folderLen) {
                    changed = true
                    break // Assuming unique IDs
                }
            }
            if (changed) {
                await db.projects.put(project)
            }
        }
    },

    duplicateRequest: async (projectId: string, requestId: string) => {
        const project = await db.projects.get(projectId)
        if (!project) throw new Error("Project not found")

        let originalRequest = project.requests.find((r) => r.id === requestId)
        let targetFolderId: string | undefined

        if (!originalRequest && project.folders) {
            for (const folder of project.folders) {
                originalRequest = folder.requests.find((r) => r.id === requestId)
                if (originalRequest) {
                    targetFolderId = folder.id
                    break
                }
            }
        }

        if (!originalRequest) throw new Error("Request not found")

        const duplicatedRequest: HttpRequest = {
            ...originalRequest,
            id: uuidv4(),
            name: `${originalRequest.name} (Copy)`,
            createdAt: Date.now()
        }

        if (targetFolderId && project.folders) {
            const folder = project.folders.find(f => f.id === targetFolderId)
            if (folder) {
                folder.requests.push(duplicatedRequest)
            } else {
                project.requests.push(duplicatedRequest)
            }
        } else {
            project.requests.push(duplicatedRequest)
        }

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
            })),
            folders: (project.folders || []).map(folder => ({
                ...folder,
                id: uuidv4(),
                requests: folder.requests.map(req => ({
                    ...req,
                    id: uuidv4()
                }))
            }))
        }))

        await db.projects.bulkAdd(projectsWithNewIds)
    },

    moveRequest: async (projectId: string, requestId: string, targetFolderId: string | null) => {
        const project = await db.projects.get(projectId)
        if (!project) throw new Error("Project not found")

        let requestToMove: HttpRequest | undefined

        // Find the request in root
        const rootIndex = project.requests.findIndex(r => r.id === requestId)
        if (rootIndex !== -1) {
            requestToMove = project.requests[rootIndex]
            project.requests.splice(rootIndex, 1) // Remove from root
        } else if (project.folders) {
            // Find in folders
            for (const folder of project.folders) {
                const folderIndex = folder.requests.findIndex(r => r.id === requestId)
                if (folderIndex !== -1) {
                    requestToMove = folder.requests[folderIndex]
                    folder.requests.splice(folderIndex, 1) // Remove from source folder
                    break
                }
            }
        }

        if (!requestToMove) throw new Error("Request not found")

        // Add to target
        if (targetFolderId) {
            if (!project.folders) project.folders = []
            const targetFolder = project.folders.find(f => f.id === targetFolderId)
            if (targetFolder) {
                targetFolder.requests.push(requestToMove)
            } else {
                // Fallback to root if target folder not found, or throw error? 
                // Let's fallback to root to be safe, or maybe just put it back where it was?
                // For now, let's put it in root if target folder is missing, effectively "unfoldering" it.
                project.requests.push(requestToMove)
            }
        } else {
            // Move to root
            project.requests.push(requestToMove)
        }

        await db.projects.put(project)
    }
}
