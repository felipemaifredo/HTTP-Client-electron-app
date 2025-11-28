import React, { useState } from "react"
import { HttpRequest, Folder, Project } from "../stores/db"
import { projectsStore } from "../stores/projectsStore"
import Modal, { ModalType } from "./Modal"
import FolderSelectionModal from "./FolderSelectionModal"
import styles from "./RequestList.module.css"
import { BsFolderSymlink } from "react-icons/bs"
import CollectionRunnerModal from "./CollectionRunnerModal"

interface Props {
    projectId: string
    project: Project
    requests: HttpRequest[]
    folders: Folder[]
    selectedRequestId: string | null
    onSelectRequest: (id: string) => void
    onDuplicateRequest?: (id: string) => void
}

interface ModalState {
    isOpen: boolean
    type: ModalType
    title: string
    message?: string
    onConfirm: (value?: string) => void
    isDanger?: boolean
}

const RequestList: React.FC<Props> = ({ projectId, project, requests, folders, selectedRequestId, onSelectRequest, onDuplicateRequest }) => {
    const [modal, setModal] = useState<ModalState | null>(null)
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
    const [editFolderName, setEditFolderName] = useState("")
    const [showFolderModal, setShowFolderModal] = useState(false)
    const [movingRequestId, setMovingRequestId] = useState<string | null>(null)
    const [runnerFolder, setRunnerFolder] = useState<Folder | null>(null)

    const handleNewRequest = (folderId?: string) => {
        setModal({
            isOpen: true,
            type: "prompt",
            title: folderId ? "New Request in Folder" : "New Request",
            message: "Enter the request name:",
            onConfirm: async (name) => {
                if (name && name.trim()) {
                    const newRequest = await projectsStore.addRequest(projectId, name.trim(), folderId)
                    onSelectRequest(newRequest.id)
                }
                setModal(null)
            }
        })
    }

    const handleNewFolder = () => {
        setModal({
            isOpen: true,
            type: "prompt",
            title: "New Folder",
            message: "Enter the folder name:",
            onConfirm: async (name) => {
                if (name && name.trim()) {
                    await projectsStore.addFolder(projectId, name.trim())
                }
                setModal(null)
            }
        })
    }

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        setModal({
            isOpen: true,
            type: "confirm",
            title: "Delete Request",
            message: "Are you sure you want to delete this request?",
            isDanger: true,
            onConfirm: async () => {
                await projectsStore.deleteRequest(projectId, id)
                if (selectedRequestId === id) {
                    onSelectRequest("")
                }
                setModal(null)
            }
        })
    }

    const handleDeleteFolder = (e: React.MouseEvent, folderId: string) => {
        e.stopPropagation()
        setModal({
            isOpen: true,
            type: "confirm",
            title: "Delete Folder",
            message: "Are you sure you want to delete this folder and all its requests?",
            isDanger: true,
            onConfirm: async () => {
                await projectsStore.deleteFolder(projectId, folderId)
                // If the selected request was in this folder, deselect it
                // This is a bit tricky without knowing exactly which request is selected relative to the folder,
                // but we can just check if the selected request ID is no longer in the project after deletion.
                // For simplicity, we won't force deselect here unless we want to do a more expensive check.
                // Or we could iterate the folder requests before deleting.
                setModal(null)
            }
        })
    }

    const handleDuplicate = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (onDuplicateRequest) {
            onDuplicateRequest(id)
        } else {
            const duplicated = await projectsStore.duplicateRequest(projectId, id)
            onSelectRequest(duplicated.id)
        }
    }

    const handleStartEditFolder = (e: React.MouseEvent, folder: Folder) => {
        e.stopPropagation()
        setEditingFolderId(folder.id)
        setEditFolderName(folder.name)
    }

    const handleSaveEditFolder = async () => {
        if (editingFolderId && editFolderName.trim()) {
            await projectsStore.renameFolder(projectId, editingFolderId, editFolderName.trim())
            setEditingFolderId(null)
        }
    }

    const handleKeyDownFolder = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSaveEditFolder()
        if (e.key === "Escape") setEditingFolderId(null)
    }

    const toggleFolder = async (folderId: string, currentState: boolean) => {
        await projectsStore.toggleFolder(projectId, folderId, !currentState)
    }

    const handleOpenMoveRequest = (e: React.MouseEvent, requestId: string) => {
        e.stopPropagation()
        setMovingRequestId(requestId)
        setShowFolderModal(true)
    }

    const handleMoveRequest = async (targetFolderId: string | null) => {
        if (movingRequestId) {
            await projectsStore.moveRequest(projectId, movingRequestId, targetFolderId)
            setShowFolderModal(false)
            setMovingRequestId(null)
        }
    }

    const getCurrentFolderId = (requestId: string) => {
        if (!folders) return null
        for (const folder of folders) {
            if (folder.requests.find(r => r.id === requestId)) {
                return folder.id
            }
        }
        return null
    }

    function extractAfterDoubleBraces(input: string) {
        const regex = /^{{[^}]+}}(.*)$/

        const match = input.match(regex)
        if (!match) {
            // it doesn't start with {{...}}
            return input
        }

        const rest = match[1]

        if (rest.trim() === "") {
            // {{...}} It's the entire string, so it returns the string itself.
            return input
        }

        return rest
    }

    const renderRequestItem = (request: HttpRequest) => (
        <div
            key={request.id}
            className={`${styles.requestItem} ${selectedRequestId === request.id ? styles.active : ""}`}
            onClick={() => onSelectRequest(request.id)}
        >
            <span className={`${styles.methodBadge} ${styles[request.method]}`}>
                {request.method}
            </span>
            <div className={styles.requestInfo}>
                <div className={styles.requestName}>{request.name}</div>
                <div className={styles.requestUrl}>{`${extractAfterDoubleBraces(request.url)}` || ""}</div>
            </div>
            <div className={styles.actionButtons}>
                <button
                    className={styles.duplicateButton}
                    onClick={(e) => handleOpenMoveRequest(e, request.id)}
                    title="Change Folder"
                >
                    <BsFolderSymlink />
                </button>
                <button
                    className={styles.duplicateButton}
                    onClick={(e) => handleDuplicate(e, request.id)}
                    title="Duplicate"
                >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 2H11L14 5V12C14 12.5304 13.7893 13.0391 13.4142 13.4142C13.0391 13.7893 12.5304 14 12 14H4C3.46957 14 2.96086 13.7893 2.58579 13.4142C2.21071 13.0391 2 12.5304 2 12V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M11 2V5H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <button
                    className={styles.deleteButton}
                    onClick={(e) => handleDelete(e, request.id)}
                    title="Delete"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    )

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.headerTitle}>Requests</h2>
                <div className={styles.headerButtons}>
                    <button className={styles.newRequestButton} onClick={() => handleNewRequest()}>
                        + Request
                    </button>
                    <button className={styles.newFolderButton} onClick={handleNewFolder} title="New Folder">
                        + Folder
                    </button>
                </div>
            </div>

            <div className={styles.requestList}>
                {/* Top-level Requests */}
                {requests.map(renderRequestItem)}

                {/* Folders */}
                {folders && folders.map((folder) => (
                    <div key={folder.id} className={styles.folderContainer}>
                        <div className={styles.folderHeader} onClick={() => toggleFolder(folder.id, !!folder.isOpen)}>
                            {editingFolderId === folder.id ? (
                                <input
                                    autoFocus
                                    value={editFolderName}
                                    onChange={(e) => setEditFolderName(e.target.value)}
                                    onBlur={handleSaveEditFolder}
                                    onKeyDown={handleKeyDownFolder}
                                    onClick={(e) => e.stopPropagation()}
                                    className={styles.editInput}
                                />
                            ) : (
                                <div className={styles.folderTitle}>
                                    <span className={styles.folderIcon}>
                                        {folder.isOpen ? (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                                            </svg>
                                        ) : (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                                            </svg>
                                        )}
                                    </span>
                                    <span className={styles.folderName}>{folder.name}</span>
                                    <span className={styles.folderCount}>({folder.requests.length})</span>
                                </div>
                            )}
                            {editingFolderId !== folder.id && (
                                <div className={styles.folderActions}>
                                    <button
                                        className={styles.folderAddButton}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleNewRequest(folder.id)
                                        }}
                                        title="Add Request to Folder"
                                    >
                                        +
                                    </button>
                                    <button
                                        className={styles.folderRenameButton}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setRunnerFolder(folder)
                                        }}
                                        title="Run Folder"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                        </svg>
                                    </button>
                                    <button
                                        className={styles.folderRenameButton}
                                        onClick={(e) => handleStartEditFolder(e, folder)}
                                        title="Rename Folder"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                    </button>
                                    <button
                                        className={styles.deleteButton}
                                        onClick={(e) => handleDeleteFolder(e, folder.id)}
                                        title="Delete Folder"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                        {folder.isOpen && (
                            <div className={styles.folderContent}>
                                {folder.requests.map(renderRequestItem)}
                                {folder.requests.length === 0 && (
                                    <div className={styles.emptyFolderState}>
                                        Empty folder
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {requests.length === 0 && (!folders || folders.length === 0) && (
                    <div className={styles.emptyState}>
                        No requests yet. Click "+ New" to create one.
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

            {showFolderModal && movingRequestId && (
                <FolderSelectionModal
                    folders={folders || []}
                    currentFolderId={getCurrentFolderId(movingRequestId)}
                    onSelect={handleMoveRequest}
                    onCancel={() => {
                        setShowFolderModal(false)
                        setMovingRequestId(null)
                    }}
                />
            )}

            {runnerFolder && (
                <CollectionRunnerModal
                    folder={runnerFolder}
                    project={project}
                    onClose={() => setRunnerFolder(null)}
                />
            )}
        </div>
    )
}

export default RequestList
