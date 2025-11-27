import React from "react"
import styles from "./TitleBar.module.css"
import logo from "../resourses/logo.png"
import { GrUpdate } from "react-icons/gr"

interface Props {
    theme: "light" | "dark"
    toggleTheme: () => void
    onNewProject: () => void
    onImport: () => void
    updateAvailable: boolean
    updatePriority: "normal" | "urgent"
}

const TitleBar: React.FC<Props> = ({ theme, toggleTheme, onNewProject, onImport, updateAvailable, updatePriority }) => {
    return (
        <div className={styles.titlebar}>
            <div className={styles.leftSection}>
                <img src={logo} alt="HTTP Client" className={styles.logo} />
                <span className={styles.appTitle}>HTTP Client</span>

                <div className={styles.actions}>
                    <button
                        className={`${styles.actionButton} ${styles.newProject}`}
                        onClick={onNewProject}
                        title="New Project"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                    </button>
                    <button
                        className={styles.actionButton}
                        onClick={onImport}
                        title="Import Projects"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className={styles.rightSection}>
                {updateAvailable && (
                    <a
                        href="https://github.com/felipemaifredo/HTTP-Client-electron-app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.updateButton} ${updatePriority === "urgent" ? styles.urgent : ""}`}
                        title={updatePriority === "urgent" ? "Urgent Update Available" : "Update Available"}
                    >
                        <GrUpdate />
                    </a>
                )}
                <button
                    className={styles.themeButton}
                    onClick={toggleTheme}
                    title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
                >
                    {theme === "light" ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                    ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="5" />
                            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                        </svg>
                    )}
                </button>

                <div className={styles.divider}></div>

                <button
                    className={styles.windowButton}
                    onClick={() => window.api.minimize()}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
                <button
                    className={styles.windowButton}
                    onClick={() => window.api.maximize()}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    </svg>
                </button>
                <button
                    className={`${styles.windowButton} ${styles.close}`}
                    onClick={() => window.api.close()}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    )
}

export default TitleBar
