import styles from "./styles/CollectionRunnerModal.module.css"
import React, { useState, useRef, useEffect } from "react"
import { Folder, Project, HttpRequest } from "../stores/db"
import { httpClient } from "../services/httpClient"
import { validateSchema } from "../utils/schemaUtils"
import { projectsStore } from "../stores/projectsStore"

interface Props {
    folder: Folder
    project: Project
    onClose: () => void
}

type RequestStatus = "pending" | "running" | "success" | "error" | "skipped"

interface RequestResult {
    request: HttpRequest
    status: RequestStatus
    statusCode?: number
    duration?: number
    error?: string
    schemaValidation?: {
        valid: boolean
        errors: string[]
    }
}

export const CollectionRunnerModal: React.FC<Props> = ({ folder, project, onClose }) => {
    const [results, setResults] = useState<RequestResult[]>(
        folder.requests.map(req => ({ request: req, status: "pending" }))
    )
    const [isRunning, setIsRunning] = useState(false)
    const [selectedEnv, setSelectedEnv] = useState<"dev" | "production">("dev")
    const [stopOnError, setStopOnError] = useState(false)
    const abortControllerRef = useRef<AbortController | null>(null)
    const resultsEndRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom when results change
    useEffect(() => {
        if (resultsEndRef.current) {
            resultsEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [results])

    function substituteVariables(text: string, env: Record<string, string>) {
        let result = text
        Object.entries(env).forEach(([key, value]) => {
            result = result.replace(new RegExp(`{{${key}}}`, "g"), value)
        })
        return result
    }

    const stopRun = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
        setIsRunning(false)
    }

    async function runAll() {
        if (folder.requests.length === 0) return

        setIsRunning(true)
        setResults(
            folder.requests.map(req => ({ request: req, status: "pending" }))
        )

        abortControllerRef.current = new AbortController()
        const signal = abortControllerRef.current.signal

        const envVars = project.environments?.[selectedEnv] || {}

        for (let i = 0; i < folder.requests.length; i++) {
            if (signal.aborted) break

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
                if (requestToSend.headers) {
                    const headersString = JSON.stringify(requestToSend.headers)
                    requestToSend.headers = JSON.parse(substituteVariables(headersString, envVars))
                }

                // Substitute in params
                if (requestToSend.params) {
                    const paramsString = JSON.stringify(requestToSend.params)
                    requestToSend.params = JSON.parse(substituteVariables(paramsString, envVars))
                }

                // Substitute in body if it exists
                if (requestToSend.body) {
                    const bodyString = JSON.stringify(requestToSend.body)
                    requestToSend.body = JSON.parse(substituteVariables(bodyString, envVars))
                }

                const startTime = Date.now()
                // We can't easily pass the signal to axios/fetch if httpClient doesn't support it, 
                // but we can check it after the request completes.
                const response = await httpClient.run(requestToSend)

                if (signal.aborted) {
                    setResults(prev => prev.map((r, idx) =>
                        idx === i ? { ...r, status: "skipped" } : r
                    ))
                    break
                }

                const duration = Date.now() - startTime

                // Prepare response object for saving
                const responseToSave = {
                    ...response,
                    timestamp: Date.now(),
                    duration
                }

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

                    // Save to DB
                    await projectsStore.updateRequest(project.id, {
                        ...request,
                        lastResponse: responseToSave
                    })

                    if (stopOnError) {
                        setIsRunning(false)
                        break
                    }
                } else {
                    // Validate Schema if exists
                    let schemaValidation = undefined
                    if (request.expectedTypes) {
                        schemaValidation = validateSchema(request.expectedTypes, response.data)
                    }

                    // Update status to success
                    setResults(prev => prev.map((r, idx) =>
                        idx === i ? {
                            ...r,
                            status: "success",
                            statusCode: response.status,
                            duration,
                            schemaValidation
                        } : r
                    ))

                    // Save to DB
                    await projectsStore.updateRequest(project.id, {
                        ...request,
                        lastResponse: responseToSave
                    })
                }
            } catch (err: any) {
                if (signal.aborted) break

                // Update status to error
                setResults(prev => prev.map((r, idx) =>
                    idx === i ? {
                        ...r,
                        status: "error",
                        error: err.message
                    } : r
                ))

                if (stopOnError) {
                    setIsRunning(false)
                    break
                }
            }
        }

        setIsRunning(false)
    }

    const passedCount = results.filter(r => r.status === "success").length
    const failedCount = results.filter(r => r.status === "error").length
    const completedCount = results.filter(r => r.status === "success" || r.status === "error").length
    const progressPercentage = folder.requests.length > 0
        ? (completedCount / folder.requests.length) * 100
        : 0

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

                <div className={styles.progressBarContainer}>
                    <div
                        className={styles.progressBarFill}
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>

                <div className={styles.resultsList}>
                    {folder.requests.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyStateIcon}>📂</div>
                            <p>This folder has no requests to run.</p>
                        </div>
                    ) : (
                        results.map((result) => (
                            <div key={result.request.id} className={styles.resultItem}>
                                <div className={styles.resultHeader}>
                                    <span className={`${styles.statusBadge} ${styles[result.status]}`}>
                                        {result.status === "pending" && "⏸"}
                                        {result.status === "running" && "▶"}
                                        {result.status === "success" && "✓"}
                                        {result.status === "error" && "✗"}
                                        {result.status === "skipped" && "⏭"}
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
                                    {result.schemaValidation && (
                                        <span className={`${styles.schemaBadge} ${result.schemaValidation.valid ? styles.schemaValid : styles.schemaInvalid}`}>
                                            {result.schemaValidation.valid ? "Match Schema" : "Does Not Match Schema"}
                                        </span>
                                    )}
                                </div>
                                {result.error && (
                                    <div className={styles.errorMessage}>{result.error}</div>
                                )}
                            </div>
                        ))
                    )}
                    <div ref={resultsEndRef} />
                </div>

                <div className={styles.actions}>
                    <div className={styles.stopOnError}>
                        <label>
                            <input
                                type="checkbox"
                                checked={stopOnError}
                                onChange={(e) => setStopOnError(e.target.checked)}
                                disabled={isRunning}
                            />
                            Stop on error
                        </label>
                    </div>
                    <div className={styles.actionsRight}>
                        <button
                            className={`${styles.button} ${styles.buttonCancel}`}
                            onClick={onClose}
                            disabled={isRunning}
                        >
                            Close
                        </button>
                        {isRunning ? (
                            <button
                                className={`${styles.button} ${styles.buttonStop}`}
                                onClick={stopRun}
                            >
                                Stop Run
                            </button>
                        ) : (
                            <button
                                className={`${styles.button} ${styles.buttonConfirm}`}
                                onClick={runAll}
                                disabled={folder.requests.length === 0}
                            >
                                {results.some(r => r.status !== "pending") ? "Run Again" : "Run All"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
