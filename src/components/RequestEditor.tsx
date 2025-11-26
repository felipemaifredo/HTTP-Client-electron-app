import React, { useState, useEffect } from "react"
import { HttpRequest } from "../stores/db"
import { projectsStore } from "../stores/projectsStore"
import { httpClient } from "../services/httpClient"
import styles from "./RequestEditor.module.css"

interface Props {
    projectId: string
    request: HttpRequest
}

const RequestEditor: React.FC<Props> = ({ projectId, request }) => {
    const [localRequest, setLocalRequest] = useState<HttpRequest>(request)
    const [response, setResponse] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<"params" | "headers" | "body">("params")

    // Local state for text editing
    const [paramsText, setParamsText] = useState("")
    const [headersText, setHeadersText] = useState("")
    const [bodyText, setBodyText] = useState("")

    // Validation errors
    const [paramsError, setParamsError] = useState(false)
    const [headersError, setHeadersError] = useState(false)
    const [bodyError, setBodyError] = useState(false)

    useEffect(() => {
        setLocalRequest(request)
        setResponse(null)

        // Only show JSON if there's actual data, otherwise keep empty
        setParamsText(Object.keys(request.params).length > 0 ? JSON.stringify(request.params, null, 2) : "")
        setHeadersText(Object.keys(request.headers).length > 0 ? JSON.stringify(request.headers, null, 2) : "")
        setBodyText(request.body ? JSON.stringify(request.body, null, 2) : "")

        // Reset errors
        setParamsError(false)
        setHeadersError(false)
        setBodyError(false)
    }, [request.id])

    const handleChange = (field: keyof HttpRequest, value: any) => {
        const updated = { ...localRequest, [field]: value }
        setLocalRequest(updated)
    }

    const save = async () => {
        await projectsStore.updateRequest(projectId, localRequest)
    }

    const handleSend = async () => {
        setLoading(true)
        setResponse(null)
        try {
            await save()
            const res = await httpClient.run(localRequest)
            setResponse(res)
        } catch (err: any) {
            setResponse({ error: err.message })
        } finally {
            setLoading(false)
        }
    }

    const handleParamsBlur = () => {
        if (!paramsText.trim()) {
            handleChange("params", {})
            setParamsError(false)
            save()
            return
        }
        try {
            const parsed = JSON.parse(paramsText)
            handleChange("params", parsed)
            setParamsError(false)
            save()
        } catch (e) {
            setParamsError(true)
            console.error("Invalid JSON in params:", e)
        }
    }

    const handleHeadersBlur = () => {
        if (!headersText.trim()) {
            handleChange("headers", {})
            setHeadersError(false)
            save()
            return
        }
        try {
            const parsed = JSON.parse(headersText)
            handleChange("headers", parsed)
            setHeadersError(false)
            save()
        } catch (e) {
            setHeadersError(true)
            console.error("Invalid JSON in headers:", e)
        }
    }

    const handleBodyBlur = () => {
        if (!bodyText.trim()) {
            handleChange("body", null)
            setBodyError(false)
            save()
            return
        }
        try {
            const parsed = JSON.parse(bodyText)
            handleChange("body", parsed)
            setBodyError(false)
            save()
        } catch (e) {
            setBodyError(true)
            console.error("Invalid JSON in body:", e)
        }
    }

    const handleNameChange = (newName: string) => {
        const updated = { ...localRequest, name: newName }
        setLocalRequest(updated)
    }

    const handleNameBlur = () => {
        save()
    }

    return (
        <div className={styles.editor}>
            <div className={styles.nameHeader}>
                <input
                    className={styles.nameInput}
                    value={localRequest.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onBlur={handleNameBlur}
                    placeholder="Request Name"
                />
            </div>
            <div className={styles.toolbar}>
                <select
                    className={styles.methodSelect}
                    value={localRequest.method}
                    onChange={(e) => handleChange("method", e.target.value)}
                >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                </select>
                <input
                    className={styles.urlInput}
                    placeholder="https://api.example.com/v1/resource"
                    value={localRequest.url}
                    onChange={(e) => handleChange("url", e.target.value)}
                    onBlur={save}
                />
                <button className={styles.sendButton} onClick={handleSend} disabled={loading}>
                    {loading ? "Sending..." : "Send"}
                </button>
            </div>

            <div className={styles.tabs}>
                {["params", "headers", "body"].map((tab) => (
                    <button
                        key={tab}
                        className={`${styles.tab} ${activeTab === tab ? styles.active : ""}`}
                        onClick={() => setActiveTab(tab as any)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            <div className={styles.tabContent}>
                {activeTab === "params" && (
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Query Parameters (JSON)</label>
                        <textarea
                            className={`${styles.textarea} ${paramsError ? styles.error : ""}`}
                            value={paramsText}
                            onChange={(e) => {
                                setParamsText(e.target.value)
                                setParamsError(false)
                            }}
                            onBlur={handleParamsBlur}
                            placeholder='{ "key": "value" }'
                        />
                        {paramsError && <span className={styles.errorText}>Invalid JSON format</span>}
                    </div>
                )}
                {activeTab === "headers" && (
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Headers (JSON)</label>
                        <textarea
                            className={`${styles.textarea} ${headersError ? styles.error : ""}`}
                            value={headersText}
                            onChange={(e) => {
                                setHeadersText(e.target.value)
                                setHeadersError(false)
                            }}
                            onBlur={handleHeadersBlur}
                            placeholder='{ "Content-Type": "application/json" }'
                        />
                        {headersError && <span className={styles.errorText}>Invalid JSON format</span>}
                    </div>
                )}
                {activeTab === "body" && (
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Request Body (JSON)</label>
                        <textarea
                            className={`${styles.textarea} ${bodyError ? styles.error : ""}`}
                            value={bodyText}
                            onChange={(e) => {
                                setBodyText(e.target.value)
                                setBodyError(false)
                            }}
                            onBlur={handleBodyBlur}
                            placeholder='{ "key": "value" }'
                        />
                        {bodyError && <span className={styles.errorText}>Invalid JSON format</span>}
                    </div>
                )}
            </div>

            {response && (
                <div className={styles.response}>
                    <div className={styles.responseHeader}>
                        {response.error ? (
                            <span className={`${styles.statusBadge} ${styles.error}`}>Error</span>
                        ) : (
                            <span className={`${styles.statusBadge} ${styles.success}`}>
                                {response.status} {response.statusText}
                            </span>
                        )}
                        {response.duration && (
                            <span className={styles.responseTime}>{response.duration}ms</span>
                        )}
                    </div>
                    <div className={styles.responseBody}>
                        <pre className={styles.responseCode}>
                            {response.error
                                ? response.error
                                : JSON.stringify(response.data, null, 2)}
                        </pre>
                    </div>
                </div>
            )}

            {!response && (
                <div className={styles.emptyResponse}>
                    Send a request to see the response here
                </div>
            )}
        </div>
    )
}

export default RequestEditor
