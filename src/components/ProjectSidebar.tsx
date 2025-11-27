import React, { useState } from "react"
import { Project } from "../stores/db"
import { projectsStore } from "../stores/projectsStore"
import Modal, { ModalType } from "./Modal"
import EnvironmentVariablesModal from "./EnvironmentVariablesModal"
import styles from "./ProjectSidebar.module.css"

interface Props {
    projects: Project[]
    selectedProjectId: string | null
    onSelectProject: (id: string) => void
    onNewProject: () => void
    onImport: () => void
}

interface ModalState {
    isOpen: boolean
    type: ModalType
    title: string
    message?: string
    onConfirm: (value?: string) => void
    isDanger?: boolean
}

const ProjectSidebar: React.FC<Props> = ({ projects, selectedProjectId, onSelectProject, onNewProject, onImport }) => {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState("")
    const [modal, setModal] = useState<ModalState | null>(null)
    const [envModalProject, setEnvModalProject] = useState<Project | null>(null)

    const handleStartEdit = (project: Project) => {
        setEditingId(project.id)
        setEditName(project.name)
    }

    const handleSaveEdit = async () => {
        if (editingId && editName.trim()) {
            await projectsStore.updateProject(editingId, { name: editName.trim() })
            setEditingId(null)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSaveEdit()
        if (e.key === "Escape") setEditingId(null)
    }

    const handleExport = async (e: React.MouseEvent, project: Project) => {
        e.stopPropagation()
        await window.api.saveProjects([project])
    }

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        setModal({
            isOpen: true,
            type: "confirm",
            title: "Delete Project",
            message: "Are you sure you want to delete this project? All requests will be lost.",
            isDanger: true,
            onConfirm: async () => {
                await projectsStore.deleteProject(id)
                if (selectedProjectId === id) {
                    onSelectProject("")
                }
                setModal(null)
            }
        })
    }

    return (
        <div className={styles.sidebar}>
            <div className={styles.header}>
                <h2 className={styles.headerTitle}>Projects</h2>
                <div className={styles.headerActions}>
                    <button
                        className={styles.actionButton}
                        onClick={onNewProject}
                        title="New Project"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                    </button>
                    <button
                        className={styles.actionButton}
                        onClick={onImport}
                        title="Import Projects"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className={styles.projectList}>
                {projects.map((project) => (
                    <div
                        key={project.id}
                        className={`${styles.projectItem} ${selectedProjectId === project.id ? styles.active : ""}`}
                        onClick={() => onSelectProject(project.id)}
                    >
                        {editingId === project.id ? (
                            <input
                                autoFocus
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={handleSaveEdit}
                                onKeyDown={handleKeyDown}
                                onClick={(e) => e.stopPropagation()}
                                className={styles.editInput}
                            />
                        ) : (
                            <>
                                <div className={styles.projectContent} onDoubleClick={() => handleStartEdit(project)}>
                                    <span className={styles.projectIcon}>📁</span>
                                    <span className={styles.projectName}>{project.name}</span>
                                </div>

                                <div className={styles.projectActions}>
                                    <button
                                        className={`${styles.actionButton} ${styles.edit}`}
                                        onClick={(e) => { e.stopPropagation(); handleStartEdit(project) }}
                                        title="Rename"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                    </button>
                                    <button
                                        className={styles.actionButton}
                                        onClick={(e) => { e.stopPropagation(); setEnvModalProject(project) }}
                                        title="Settings"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="3"></circle>
                                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                        </svg>
                                    </button>
                                    <button
                                        className={styles.actionButton}
                                        onClick={(e) => handleExport(e, project)}
                                        title="Export Project"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                                        </svg>
                                    </button>
                                    <button
                                        className={`${styles.actionButton} ${styles.delete}`}
                                        onClick={(e) => handleDelete(e, project.id)}
                                        title="Delete Project"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                {projects.length === 0 && (
                    <div className={styles.emptyState}>
                        No projects found. Create one from the top bar.
                    </div>
                )}
            </div>

            {modal && (
                <Modal
                    type={modal.type}
                    title={modal.title}
                    message={modal.message}
                    onConfirm={modal.onConfirm}
                    onCancel={() => setModal(null)}
                    isDanger={modal.isDanger}
                />
            )}

            {envModalProject && (
                <EnvironmentVariablesModal
                    project={envModalProject}
                    onClose={() => setEnvModalProject(null)}
                />
            )}
        </div>
    )
}

export default ProjectSidebar
