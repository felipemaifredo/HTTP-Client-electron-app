import styles from "./styles/CollectionRunnerModal.module.css"
import React, { useState } from "react"
import { Folder, Project, HttpRequest } from "../stores/db"
import { httpClient } from "../services/httpClient"

interface Props {
    folder: Folder
    project: Project
    onClose: () => void
}

type RequestStatus = "pending" | "running" | "success" | "error"

interface RequestResult {
    request: HttpRequest
    status: RequestStatus
    statusCode?: number
    duration?: number
    error?: string
}

export const CollectionRunnerModal: React.FC<Props> = ({ folder, project, onClose }) => {
    const [results, setResults] = useState<RequestResult[]>(
        folder.requests.map(req => ({ request: req, status: "pending" }))
    )
    const [isRunning, setIsRunning] = useState(false)
    const [selectedEnv, setSelectedEnv] = useState<"dev" | "production">("dev")

    function substituteVariables(text: string, env: Record<string, string>) {
        let result = text
        Object.entries(env).forEach(([key, value]) => {
            result = result.replace(new RegExp(`{{${key}}}`, "g"), value)
        })
        return result
    }

    async function runAll() {
        setIsRunning(true)
        setResults(
            folder.requests.map(req => ({ request: req, status: "pending" }))
        )
        const envVars = project.environments?.[selectedEnv] || {}

        for (let i = 0; i < folder.requests.length; i++) {
            const request = folder.requests[i]

            // Update status to running
            setResults(prev => prev.map((r, idx) =>
                idx === i ? { ...r, status: "running" } : r
            ))

            try {
                // Deep copy and substitute variables
                const requestToSend = JSON.parse(JSON.stringify(request)) as HttpRequest

                requestToSend.url = substituteVariables(requestToSend.url, envVars)

                // Substitute in headers
                const headersString = JSON.stringify(requestToSend.headers)
                requestToSend.headers = JSON.parse(substituteVariables(headersString, envVars))

                // Substitute in params
                const paramsString = JSON.stringify(requestToSend.params)
                requestToSend.params = JSON.parse(substituteVariables(paramsString, envVars))

                // Substitute in body if it exists
                if (requestToSend.body) {
                    const bodyString = JSON.stringify(requestToSend.body)
                    requestToSend.body = JSON.parse(substituteVariables(bodyString, envVars))
                }

                const startTime = Date.now()
                const response = await httpClient.run(requestToSend)
                const duration = Date.now() - startTime

                // Check if response has error property or is an HTTP error status
                if (response.error || (response.status && response.status >= 400)) {
                    // Update status to error
                    setResults(prev => prev.map((r, idx) =>
                        idx === i ? {
                            ...r,
                            status: "error",
                            statusCode: response.status,
                            error: response.error || `HTTP ${response.status}: ${response.statusText}`,
                            duration
                        } : r
                    ))
                } else {
                    // Update status to success
                    setResults(prev => prev.map((r, idx) =>
                        idx === i ? {
                            ...r,
                            status: "success",
                            statusCode: response.status,
                            duration
                        } : r
                    ))
                }
            } catch (err: any) {
                // Update status to error
                setResults(prev => prev.map((r, idx) =>
                    idx === i ? {
                        ...r,
                        status: "error",
                        error: err.message
                    } : r
                ))
            }
        }

        setIsRunning(false)
    }

    const passedCount = results.filter(r => r.status === "success").length
    const failedCount = results.filter(r => r.status === "error").length

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3 className={styles.title}>Collection Runner - {folder.name}</h3>
                    <div className={styles.envSelector}>
                        <label>Environment:</label>
                        <select
                            value={selectedEnv}
                            onChange={(e) => setSelectedEnv(e.target.value as "dev" | "production")}
                            disabled={isRunning}
                            className={styles.select}
                        >
                            <option value="dev">Development</option>
                            <option value="production">Production</option>
                        </select>
                    </div>
                </div>

                <div className={styles.summary}>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Total:</span>
                        <span className={styles.summaryValue}>{folder.requests.length}</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Passed:</span>
                        <span className={`${styles.summaryValue} ${styles.success}`}>{passedCount}</span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Failed:</span>
                        <span className={`${styles.summaryValue} ${styles.error}`}>{failedCount}</span>
                    </div>
                </div>

                <div className={styles.resultsList}>
                    {results.map((result) => (
                        <div key={result.request.id} className={styles.resultItem}>
                            <div className={styles.resultHeader}>
                                <span className={`${styles.statusBadge} ${styles[result.status]}`}>
                                    {result.status === "pending" && "⏸"}
                                    {result.status === "running" && "▶"}
                                    {result.status === "success" && "✓"}
                                    {result.status === "error" && "✗"}
                                </span>
                                <span className={`${styles.methodBadge} ${styles[result.request.method]}`}>
                                    {result.request.method}
                                </span>
                                <span className={styles.requestName}>{result.request.name}</span>
                                {result.statusCode && (
                                    <span className={styles.statusCode}>{result.statusCode}</span>
                                )}
                                {result.duration && (
                                    <span className={styles.duration}>{result.duration}ms</span>
                                )}
                            </div>
                            {result.error && (
                                <div className={styles.errorMessage}>{result.error}</div>
                            )}
                        </div>
                    ))}
                </div>

                <div className={styles.actions}>
                    <button
                        className={`${styles.button} ${styles.buttonCancel}`}
                        onClick={onClose}
                        disabled={isRunning}
                    >
                        Close
                    </button>
                    <button
                        className={`${styles.button} ${styles.buttonConfirm}`}
                        onClick={runAll}
                        disabled={isRunning}
                    >
                        {isRunning ? "Running..." : "Run All"}
                    </button>
                </div>
            </div>
        </div>
    )
}
