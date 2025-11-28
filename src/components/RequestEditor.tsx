//
import styles from "./styles/RequestEditor.module.css"

//
import React, { useState, useEffect } from "react"
import { JSONTree } from 'react-json-tree'

//
import { HttpRequest, Project } from "../stores/db"
import { projectsStore } from "../stores/projectsStore"
import { httpClient } from "../services/httpClient"

//
interface Props {
    project: Project
    request: HttpRequest
}

const transparentTheme = {
    base00: "transparent", // background
    base01: "#f0f0f0",
    base02: "#d0d0d0",
    base03: "#b0b0b0",
    base04: "#505050",
    base05: "#303030",
    base06: "#202020",
    base07: "#101010",
    base08: "#ff0000",
    base09: "#ff9900",
    base0A: "#ffcc00",
    base0B: "#009400ff",
    base0C: "#00cccc",
    base0D: "#4891ffff",
    base0E: "#cc00ff",
    base0F: "#ff0066",
}

export const RequestEditor: React.FC<Props> = ({ project, request }) => {
    const [localRequest, setLocalRequest] = useState<HttpRequest>(request)
    const [forceSaveState, setForceSaveState] = useState<boolean>(false)
    const [response, setResponse] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<"params" | "headers" | "body">("params")
    const [activeEnv, setActiveEnv] = useState<"dev" | "production">("dev")
    const [copiedKey, setCopiedKey] = useState<string | null>(null)
    const [isResponseHovered, setIsResponseHovered] = useState(false)
    const [responseCopied, setResponseCopied] = useState(false)

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
        // Load last response if available
        if (request.lastResponse) {
            setResponse(request.lastResponse)
        } else {
            setResponse(null)
        }

        // Only show JSON if there's actual data, otherwise keep empty
        setParamsText(Object.keys(request.params).length > 0 ? JSON.stringify(request.params, null, 2) : "")
        setHeadersText(Object.keys(request.headers).length > 0 ? JSON.stringify(request.headers, null, 2) : "")
        setBodyText(request.body ? JSON.stringify(request.body, null, 2) : "")

        // Reset errors
        setParamsError(false)
        setHeadersError(false)
        setBodyError(false)
    }, [request.id])

    useEffect(() => {
        save()
    }, [forceSaveState])

    function forceSave() {
        setForceSaveState(!forceSaveState)
    }

    function handleChange(field: keyof HttpRequest, value: any) {
        const updated = { ...localRequest, [field]: value }
        setLocalRequest(updated)
        forceSave()
    }

    function handleSelectChange(field: keyof HttpRequest, value: any) {
        const updated = { ...localRequest, [field]: value }
        setLocalRequest(updated)
        forceSave()
    }

    async function save() {
        await projectsStore.updateRequest(project.id, localRequest)
    }

    function substituteVariables(text: string, env: Record<string, string>) {
        let result = text
        Object.entries(env).forEach(([key, value]) => {
            result = result.replace(new RegExp(`{{${key}}}`, "g"), value)
        })
        return result
    }

    async function handleSend() {
        setLoading(true)
        setResponse(null)
        try {
            await save()

            const envVars = project.environments?.[activeEnv] || {}

            // Deep copy and substitute
            const requestToSend = JSON.parse(JSON.stringify(localRequest)) as HttpRequest

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
            const res = await httpClient.run(requestToSend)
            const duration = Date.now() - startTime

            // Add timestamp and duration to response
            const responseWithTimestamp = {
                ...res,
                timestamp: Date.now(),
                duration
            }

            setResponse(responseWithTimestamp)

            // Save last response
            await projectsStore.updateRequest(project.id, {
                ...localRequest,
                lastResponse: responseWithTimestamp
            })
        } catch (err: any) {
            setResponse({ error: err.message })
        } finally {
            setLoading(false)
        }
    }

    function copyVariable(key: string) {
        const text = `{{${key}}}`
        navigator.clipboard.writeText(text)
        setCopiedKey(key)
        setTimeout(() => setCopiedKey(null), 1000)
    }

    function copyResponse() {
        if (!response) return
        const text = response.error ? response.error : JSON.stringify(response.data, null, 2)
        navigator.clipboard.writeText(text)
        setResponseCopied(true)
        setTimeout(() => setResponseCopied(false), 2000)
    }

    function handleParamsBlur() {
        if (!paramsText.trim()) {
            handleChange("params", {})
            setParamsError(false)
            return
        }
        try {
            const parsed = JSON.parse(paramsText)
            handleChange("params", parsed)
            setParamsError(false)

        } catch (e) {
            setParamsError(true)
            console.error("Invalid JSON in params:", e)
        }
    }

    function handleHeadersBlur() {
        if (!headersText.trim()) {
            handleChange("headers", {})
            setHeadersError(false)
            return
        }
        try {
            const parsed = JSON.parse(headersText)
            handleChange("headers", parsed)
            setHeadersError(false)
        } catch (e) {
            setHeadersError(true)
            console.error("Invalid JSON in headers:", e)
        }
    }

    function handleBodyBlur() {
        if (!bodyText.trim()) {
            handleChange("body", null)
            setBodyError(false)

            return
        }

        try {
            const parsed = JSON.parse(bodyText)
            handleChange("body", parsed)
            setBodyError(false)

        } catch (e) {
            setBodyError(true)
            console.error("Invalid JSON in body:", e)
        }
    }

    function handleNameChange(newName: string) {
        const updated = { ...localRequest, name: newName }
        setLocalRequest(updated)
    }

    function handleNameBlur() {
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

            <div className={styles.envBar}>
                <div className={styles.envToggleContainer}>
                    <button
                        onClick={() => setActiveEnv("dev")}
                        className={`${styles.envToggleButton} ${activeEnv === "dev" ? styles.active : ""}`}
                    >
                        Dev
                    </button>
                    <button
                        onClick={() => setActiveEnv("production")}
                        className={`${styles.envToggleButton} ${activeEnv === "production" ? styles.active : ""}`}
                    >
                        Prod
                    </button>
                </div>
                <div className={styles.variableChipsContainer}>
                    {Object.keys(project.environments?.[activeEnv] || {}).map(key => (
                        <button
                            key={key}
                            onClick={() => copyVariable(key)}
                            title="Click to copy"
                            className={`${styles.variableChip} ${copiedKey === key ? styles.copied : ""}`}
                        >
                            {key} {copiedKey === key && "✓"}
                        </button>
                    ))}
                </div>
            </div>
            <div className={styles.toolbar}>
                <select
                    className={styles.methodSelect}
                    value={localRequest.method}
                    onChange={(e) => handleSelectChange("method", e.target.value)}
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

            {loading && (
                <div className={styles.response}>
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                        <span>Processing request...</span>
                    </div>
                </div>
            )}

            {!loading && response && (
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
                        {response.timestamp && (
                            <span className={styles.responseTimestamp}>
                                {new Date(response.timestamp).toLocaleString()}
                            </span>
                        )}
                    </div>
                    <div
                        className={`${styles.responseBody} ${styles.responseBodyContainer}`}
                        onMouseEnter={() => setIsResponseHovered(true)}
                        onMouseLeave={() => setIsResponseHovered(false)}
                    >
                        {isResponseHovered && (
                            <div className={styles.responseActions}>
                                <button
                                    onClick={copyResponse}
                                    className={`${styles.copyButton} ${responseCopied ? styles.copied : ""}`}
                                >
                                    {responseCopied ? "Copied!" : "Copy JSON"}
                                </button>
                            </div>
                        )}

                        <div className={styles.jsonContainer}>
                            {response.error
                                ? (
                                    <JSONTree data={response.error} theme={transparentTheme} shouldExpandNodeInitially={() => true} />
                                )
                                : (
                                    <JSONTree data={response.data} theme={transparentTheme} shouldExpandNodeInitially={() => true} />
                                )
                            }
                        </div>
                    </div>
                </div>
            )}

            {!loading && !response && (
                <div className={styles.emptyResponse}>
                    Send a request to see the response here
                </div>
            )}
        </div >
    )
}
