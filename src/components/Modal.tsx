import styles from "./styles/Modal.module.css"
import React, { useState, useEffect, useRef } from "react"

//
export type ModalType = "alert" | "confirm" | "prompt"

//
interface ModalProps {
    type: ModalType
    title: string
    message?: string
    defaultValue?: string
    onConfirm: (value?: string) => void
    onCancel: () => void
    isDanger?: boolean
}

//
export const Modal: React.FC<ModalProps> = ({
    type,
    title,
    message,
    defaultValue = "",
    onConfirm,
    onCancel,
    isDanger = false
}) => {
    const [inputValue, setInputValue] = useState(defaultValue)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (type === "prompt" && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [type])

    function handleConfirm() {
        if (type === "prompt") {
            onConfirm(inputValue)
        } else {
            onConfirm()
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter") {
            handleConfirm()
        } else if (e.key === "Escape") {
            onCancel()
        }
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3 className={styles.title}>{title}</h3>
                </div>

                {message && <p className={styles.message}>{message}</p>}

                {type === "prompt" && (
                    <input
                        ref={inputRef}
                        type="text"
                        className={styles.input}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type here..."
                    />
                )}

                <div className={styles.actions}>
                    {type !== "alert" && (
                        <button
                            className={`${styles.button} ${styles.buttonCancel}`}
                            onClick={onCancel}
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        className={`${styles.button} ${isDanger ? styles.buttonDanger : styles.buttonConfirm
                            }`}
                        onClick={handleConfirm}
                    >
                        {type === "alert" ? "OK" : type === "confirm" ? "Confirm" : "Create"}
                    </button>
                </div>
            </div>
        </div>
    )
}
