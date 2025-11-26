import React, { useState, useEffect } from "react"
import { HttpRequest, Project } from "../stores/db"
import { projectsStore } from "../stores/projectsStore"
import { httpClient } from "../services/httpClient"
//import { generateTypes } from "../utils/typeGenerator"
import styles from "./RequestEditor.module.css"

interface Props {
    project: Project
    request: HttpRequest
}

const RequestEditor: React.FC<Props> = ({ project, request }) => {
    const [localRequest, setLocalRequest] = useState<HttpRequest>(request)
    const [response, setResponse] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<"params" | "headers" | "body">("params")
    const [activeEnv, setActiveEnv] = useState<"dev" | "production">("dev")
    const [copiedKey, setCopiedKey] = useState<string | null>(null)
    const [isResponseHovered, setIsResponseHovered] = useState(false)
    const [responseCopied, setResponseCopied] = useState(false)

    // Type generation state
    //const [showTypes, setShowTypes] = useState(false)
    //const [generatedTypes, setGeneratedTypes] = useState("")
    //const [isGeneratingTypes, setIsGeneratingTypes] = useState(false)
    //const [typesCopied, setTypesCopied] = useState(false)

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

    const handleChange = (field: keyof HttpRequest, value: any) => {
        const updated = { ...localRequest, [field]: value }
        setLocalRequest(updated)
    }

    const save = async () => {
        await projectsStore.updateRequest(project.id, localRequest)
    }

    const substituteVariables = (text: string, env: Record<string, string>) => {
        let result = text
        Object.entries(env).forEach(([key, value]) => {
            result = result.replace(new RegExp(`{{${key}}}`, "g"), value)
        })
        return result
    }

    const handleSend = async () => {
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

            const res = await httpClient.run(requestToSend)

            // Add timestamp to response
            const responseWithTimestamp = {
                ...res,
                timestamp: Date.now()
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

    const copyVariable = (key: string) => {
        const text = `{{${key}}}`
        navigator.clipboard.writeText(text)
        setCopiedKey(key)
        setTimeout(() => setCopiedKey(null), 1000)
    }

    const copyResponse = () => {
        if (!response) return
        const text = response.error ? response.error : JSON.stringify(response.data, null, 2)
        navigator.clipboard.writeText(text)
        setResponseCopied(true)
        setTimeout(() => setResponseCopied(false), 2000)
    }

    /*const handleGenerateTypes = async () => {
        if (!response || response.error) return

        if (!showTypes) {
            setShowTypes(true)
            if (!generatedTypes) {
                setIsGeneratingTypes(true)
                try {
                    const jsonString = JSON.stringify(response.data)
                    const types = await generateTypes(jsonString, "Response")
                    setGeneratedTypes(types)
                } catch (e) {
                    console.error(e)
                    setGeneratedTypes("// Error generating types")
                } finally {
                    setIsGeneratingTypes(false)
                }
            }
        } else {
            setShowTypes(false)
        }
    }*/

    /*const copyTypes = () => {
        navigator.clipboard.writeText(generatedTypes)
        setTypesCopied(true)
        setTimeout(() => setTypesCopied(false), 2000)
    }*/

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

            <div className={styles.envBar} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", borderBottom: "1px solid #333" }}>
                <div style={{ display: "flex", background: "#333", borderRadius: "4px", padding: "2px" }}>
                    <button
                        onClick={() => setActiveEnv("dev")}
                        style={{
                            background: activeEnv === "dev" ? "#646cff" : "transparent",
                            color: activeEnv === "dev" ? "white" : "#888",
                            border: "none",
                            padding: "4px 12px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px"
                        }}
                    >
                        Dev
                    </button>
                    <button
                        onClick={() => setActiveEnv("production")}
                        style={{
                            background: activeEnv === "production" ? "#646cff" : "transparent",
                            color: activeEnv === "production" ? "white" : "#888",
                            border: "none",
                            padding: "4px 12px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px"
                        }}
                    >
                        Prod
                    </button>
                </div>

                <div style={{ display: "flex", gap: "5px", overflowX: "auto", flex: 1 }}>
                    {Object.keys(project.environments?.[activeEnv] || {}).map(key => (
                        <button
                            key={key}
                            onClick={() => copyVariable(key)}
                            title="Click to copy"
                            style={{
                                background: copiedKey === key ? "#3b82f6" : "#333",
                                border: "1px solid #444",
                                color: copiedKey === key ? "white" : "#aaa",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "11px",
                                whiteSpace: "nowrap",
                                transition: "all 0.2s ease"
                            }}
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
                        {response.timestamp && (
                            <span style={{ marginLeft: "auto", color: "#666", fontSize: "12px" }}>
                                {new Date(response.timestamp).toLocaleString()}
                            </span>
                        )}
                    </div>
                    <div
                        className={styles.responseBody}
                        onMouseEnter={() => setIsResponseHovered(true)}
                        onMouseLeave={() => setIsResponseHovered(false)}
                        style={{ position: "relative", display: "flex", gap: "1px" }}
                    >
                        {isResponseHovered && (
                            <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", gap: "5px", zIndex: 10 }}>
                                {/*<button
                                    onClick={handleGenerateTypes}
                                    style={{
                                        background: showTypes ? "#646cff" : "#333",
                                        color: "white",
                                        border: "1px solid #444",
                                        borderRadius: "4px",
                                        padding: "4px 8px",
                                        fontSize: "12px",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    {showTypes ? "Hide Types" : "Generate Types"}
                                </button>*/}
                                <button
                                    onClick={copyResponse}
                                    style={{
                                        background: responseCopied ? "#10b981" : "#333",
                                        color: "white",
                                        border: "1px solid #444",
                                        borderRadius: "4px",
                                        padding: "4px 8px",
                                        fontSize: "12px",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    {responseCopied ? "Copied!" : "Copy JSON"}
                                </button>
                            </div>
                        )}

                        <div style={{ flex: 1, overflow: "auto" }}>
                            <pre className={styles.responseCode}>
                                {response.error
                                    ? response.error
                                    : JSON.stringify(response.data, null, 2)}
                            </pre>
                        </div>

                        {/*showTypes && (
                            <div style={{ flex: 1, overflow: "auto", borderLeft: "1px solid #333", paddingLeft: "10px", position: "relative" }}>
                                <button
                                    onClick={copyTypes}
                                    style={{
                                        position: "absolute",
                                        top: "10px",
                                        right: "10px",
                                        background: typesCopied ? "#10b981" : "#333",
                                        color: "white",
                                        border: "1px solid #444",
                                        borderRadius: "4px",
                                        padding: "4px 8px",
                                        fontSize: "12px",
                                        cursor: "pointer",
                                        zIndex: 5
                                    }}
                                >
                                    {typesCopied ? "Copied!" : "Copy Types"}
                                </button>
                                <pre className={styles.responseCode} style={{ color: "#a1a1aa" }}>
                                    {isGeneratingTypes ? "Generating types..." : generatedTypes}
                                </pre>
                            </div>
                        )*/}
                    </div>
                </div>
            )
            }

            {
                !response && (
                    <div className={styles.emptyResponse}>
                        Send a request to see the response here
                    </div>
                )
            }
        </div >
    )
}

export default RequestEditor
