import React, { useState } from "react"
import { Folder } from "../stores/db"
import styles from "./FolderSelectionModal.module.css"
import { FiFolder, FiFile } from "react-icons/fi"

interface Props {
    folders: Folder[]
    currentFolderId: string | null
    onSelect: (folderId: string | null) => void
    onCancel: () => void
}

const FolderSelectionModal: React.FC<Props> = ({ folders, currentFolderId, onSelect, onCancel }) => {
    const [selectedId, setSelectedId] = useState<string | null>(currentFolderId)

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onCancel()
        }
    }

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3 className={styles.title}>Move Request</h3>
                </div>

                <div className={styles.content}>
                    <div className={styles.folderList}>
                        <div
                            className={`${styles.folderItem} ${selectedId === null ? styles.selected : ""}`}
                            onClick={() => setSelectedId(null)}
                        >
                            <span className={styles.folderIcon}>
                                <FiFile />
                            </span>
                            <span className={styles.folderName}>No Folder (Root)</span>
                        </div>

                        {folders.map(folder => (
                            <div
                                key={folder.id}
                                className={`${styles.folderItem} ${selectedId === folder.id ? styles.selected : ""}`}
                                onClick={() => setSelectedId(folder.id)}
                            >
                                <span className={styles.folderIcon}>
                                    <FiFolder />
                                </span>
                                <span className={styles.folderName}>{folder.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.actions}>
                    <button className={`${styles.button} ${styles.buttonCancel}`} onClick={onCancel}>
                        Cancel
                    </button>
                    <button
                        className={`${styles.button} ${styles.buttonConfirm}`}
                        onClick={() => onSelect(selectedId)}
                    >
                        Move
                    </button>
                </div>
            </div>
        </div>
    )
}

export default FolderSelectionModal
