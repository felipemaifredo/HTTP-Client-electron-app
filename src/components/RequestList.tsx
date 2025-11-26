import React, { useState } from "react"
import { HttpRequest } from "../stores/db"
import { projectsStore } from "../stores/projectsStore"
import Modal, { ModalType } from "./Modal"
import styles from "./RequestList.module.css"

interface Props {
    projectId: string
    requests: HttpRequest[]
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

const RequestList: React.FC<Props> = ({ projectId, requests, selectedRequestId, onSelectRequest, onDuplicateRequest }) => {
    const [modal, setModal] = useState<ModalState | null>(null)

    const handleNewRequest = () => {
        setModal({
            isOpen: true,
            type: "prompt",
            title: "New Request",
            message: "Enter the request name:",
            onConfirm: async (name) => {
                if (name && name.trim()) {
                    const newRequest = await projectsStore.addRequest(projectId, name.trim())
                    onSelectRequest(newRequest.id)
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

    const handleDuplicate = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (onDuplicateRequest) {
            onDuplicateRequest(id)
        } else {
            const duplicated = await projectsStore.duplicateRequest(projectId, id)
            onSelectRequest(duplicated.id)
        }
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

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.headerTitle}>Requests</h2>
                <button className={styles.newRequestButton} onClick={handleNewRequest}>
                    + New
                </button>
            </div>

            <div className={styles.requestList}>
                {requests.map((request) => (
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
                ))}
                {requests.length === 0 && (
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
        </div>
    )
}

export default RequestList
