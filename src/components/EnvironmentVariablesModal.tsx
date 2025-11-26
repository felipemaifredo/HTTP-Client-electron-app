import React, { useState, useEffect } from "react"
import { Project } from "../stores/db"
import { projectsStore } from "../stores/projectsStore"
import styles from "./Modal.module.css"

interface Props {
    project: Project
    onClose: () => void
}

const EnvironmentVariablesModal: React.FC<Props> = ({ project, onClose }) => {
    const [devContent, setDevContent] = useState("")
    const [prodContent, setProdContent] = useState("")

    // Helper to convert JSON object to .env string
    const jsonToEnv = (env: Record<string, string>) => {
        return Object.entries(env)
            .map(([key, value]) => `${key}=${value}`)
            .join("\n")
    }

    // Helper to convert .env string to JSON object
    const envToJson = (content: string) => {
        return content.split("\n").reduce((acc, line) => {
            const trimmedLine = line.trim()
            if (!trimmedLine || trimmedLine.startsWith("#")) return acc

            const firstEquals = trimmedLine.indexOf("=")
            if (firstEquals !== -1) {
                const key = trimmedLine.slice(0, firstEquals).trim()
                const value = trimmedLine.slice(firstEquals + 1).trim()
                if (key) {
                    acc[key] = value
                }
            }
            return acc
        }, {} as Record<string, string>)
    }

    // Initialize state from project data
    useEffect(() => {
        const devEnv = project.environments?.dev || {}
        const prodEnv = project.environments?.production || {}
        setDevContent(jsonToEnv(devEnv))
        setProdContent(jsonToEnv(prodEnv))
    }, [project])

    const handleSave = async () => {
        const updatedEnvironments = {
            dev: envToJson(devContent),
            production: envToJson(prodContent)
        }

        await projectsStore.updateProject(project.id, { environments: updatedEnvironments })
        onClose()
    }

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal} style={{ maxWidth: "900px", width: "90%", height: "80vh", display: "flex", flexDirection: "column" }}>
                <div className={styles.header}>
                    <h3 className={styles.title}>Environment Variables - {project.name}</h3>
                </div>

                <div style={{ display: "flex", gap: "20px", flex: 1, minHeight: 0, marginBottom: "20px" }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        <h4 style={{ marginBottom: "10px", color: "#888" }}>Development</h4>
                        <textarea
                            className={styles.input}
                            style={{
                                flex: 1,
                                resize: "none",
                                whiteSpace: "pre",
                                padding: "10px",
                                lineHeight: "1.5"
                            }}
                            value={devContent}
                            onChange={(e) => setDevContent(e.target.value)}
                            placeholder="KEY=VALUE"
                        />
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        <h4 style={{ marginBottom: "10px", color: "#888" }}>Production</h4>
                        <textarea
                            className={styles.input}
                            style={{
                                flex: 1,
                                resize: "none",
                                whiteSpace: "pre",
                                padding: "10px",
                                lineHeight: "1.5"
                            }}
                            value={prodContent}
                            onChange={(e) => setProdContent(e.target.value)}
                            placeholder="KEY=VALUE"
                        />
                    </div>
                </div>

                <div className={styles.actions}>
                    <button
                        className={`${styles.button} ${styles.buttonCancel}`}
                        onClick={onClose}
                    >
                        Close
                    </button>
                    <button
                        className={`${styles.button} ${styles.buttonConfirm}`}
                        onClick={handleSave}
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    )
}

export default EnvironmentVariablesModal
