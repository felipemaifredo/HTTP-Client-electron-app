import { useState, useEffect } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { projectsStore } from "./stores/projectsStore"
import { importProjects } from "./utils/importJson"
import ProjectSidebar from "./components/ProjectSidebar"
import RequestList from "./components/RequestList"
import RequestEditor from "./components/RequestEditor"
import TitleBar from "./components/TitleBar"
import styles from "./App.module.css"

function App() {
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
    const [theme, setTheme] = useState<"light" | "dark">("dark")

    const projects = useLiveQuery(() => projectsStore.getAll())
    const selectedProject = projects?.find(p => p.id === selectedProjectId)
    const selectedRequest = selectedProject?.requests.find(r => r.id === selectedRequestId) ||
        selectedProject?.folders?.flatMap(f => f.requests).find(r => r.id === selectedRequestId)

    useEffect(() => {
        if (!selectedProjectId && projects && projects.length > 0) {
            setSelectedProjectId(projects[0].id)
        }
    }, [projects, selectedProjectId])

    useEffect(() => {
        document.body.className = theme
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => prev === "light" ? "dark" : "light")
    }

    const handleCreateProject = async () => {
        const project = await projectsStore.addProject("New Project")
        setSelectedProjectId(project.id)
    }

    const handleDuplicateRequest = async (requestId: string) => {
        if (selectedProjectId) {
            const duplicated = await projectsStore.duplicateRequest(selectedProjectId, requestId)
            setSelectedRequestId(duplicated.id)
        }
    }

    return (
        <div className={styles.app}>
            <TitleBar
                theme={theme}
                toggleTheme={toggleTheme}
                onNewProject={handleCreateProject}
                onImport={importProjects}
            />

            <div className={styles.mainContent}>
                <div className={styles.projectSidebarContainer}>
                    <ProjectSidebar
                        projects={projects || []}
                        selectedProjectId={selectedProjectId}
                        onSelectProject={setSelectedProjectId}
                    />
                </div>

                <div className={styles.requestListContainer}>
                    {selectedProjectId ? (
                        <RequestList
                            projectId={selectedProjectId}
                            requests={selectedProject?.requests || []}
                            folders={selectedProject?.folders || []}
                            selectedRequestId={selectedRequestId}
                            onSelectRequest={setSelectedRequestId}
                            onDuplicateRequest={handleDuplicateRequest}
                        />
                    ) : (
                        <div className={styles.emptyStateSmall}>Select or create a project</div>
                    )}
                </div>

                <div className={styles.requestEditorContainer}>
                    {selectedProjectId && selectedRequest && selectedProject ? (
                        <RequestEditor
                            project={selectedProject}
                            request={selectedRequest}
                        />
                    ) : (
                        <div className={styles.emptyState}>
                            {selectedProjectId ? "Select a request to edit" : "No project selected"}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default App
