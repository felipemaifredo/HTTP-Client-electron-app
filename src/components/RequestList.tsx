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
}

interface ModalState {
    isOpen: boolean
    type: ModalType
    title: string
    message?: string
    onConfirm: (value?: string) => void
    isDanger?: boolean
}

const RequestList: React.FC<Props> = ({ projectId, requests, selectedRequestId, onSelectRequest }) => {
    const [modal, setModal] = useState<ModalState | null>(null)

    const handleNewRequest = () => {
        setModal({
            isOpen: true,
            type: "prompt",
            title: "Nova Requisição",
            message: "Digite o nome da requisição:",
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
            title: "Excluir Requisição",
            message: "Tem certeza que deseja excluir esta requisição?",
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
                            <div className={styles.requestUrl}>{request.url || "(no url)"}</div>
                        </div>
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
