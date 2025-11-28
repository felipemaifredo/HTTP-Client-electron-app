import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EnvironmentVariablesModal } from '../EnvironmentVariablesModal'
import { Project } from '../../stores/db'

// Mock the store
vi.mock('../../stores/projectsStore', () => ({
    projectsStore: {
        updateProject: vi.fn(),
    },
}))

const mockProject: Project = {
    id: '1',
    name: 'Test Project',
    requests: [],
    folders: [],
    environments: {
        dev: { API_URL: 'http://localhost:3000' },
        production: { API_URL: 'https://api.example.com' },
    },
}

describe('EnvironmentVariablesModal', () => {
    it('renders correctly with project data', () => {
        render(<EnvironmentVariablesModal project={mockProject} onClose={() => { }} />)

        expect(screen.getByText('Environment Variables - Test Project')).toBeInTheDocument()
        expect(screen.getByDisplayValue('API_URL=http://localhost:3000')).toBeInTheDocument()
        expect(screen.getByDisplayValue('API_URL=https://api.example.com')).toBeInTheDocument()
    })

    it('calls onClose when Close button is clicked', () => {
        const onClose = vi.fn()
        render(<EnvironmentVariablesModal project={mockProject} onClose={onClose} />)

        fireEvent.click(screen.getByText('Close'))
        expect(onClose).toHaveBeenCalled()
    })
})
