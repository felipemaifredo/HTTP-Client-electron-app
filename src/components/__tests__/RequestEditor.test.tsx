import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RequestEditor from '../RequestEditor'
import { Project, HttpRequest } from '../../stores/db'
import { httpClient } from '../../services/httpClient'

// Mock dependencies
vi.mock('../../stores/projectsStore', () => ({
    projectsStore: {
        updateRequest: vi.fn(),
    },
}))

vi.mock('../../services/httpClient', () => ({
    httpClient: {
        run: vi.fn(),
    },
}))

// Mock react-json-tree to avoid rendering complex JSON tree in tests
vi.mock('react-json-tree', () => ({
    JSONTree: () => <div data-testid="json-tree">JSON Tree</div>,
}))

const mockProject: Project = {
    id: '1',
    name: 'Test Project',
    folders: [],
    requests: [],
    environments: {
        dev: { API_URL: 'http://localhost:3000' },
        production: { API_URL: 'https://api.example.com' },
    },
}

const mockRequest: HttpRequest = {
    id: 'req1',
    name: 'Get Users',
    method: 'GET',
    url: '{{API_URL}}/users',
    headers: {},
    params: {},
    body: null,
    createdAt: Date.now(),
}

describe('RequestEditor', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders request details correctly', () => {
        render(<RequestEditor project={mockProject} request={mockRequest} />)

        expect(screen.getByDisplayValue('Get Users')).toBeInTheDocument()
        expect(screen.getByDisplayValue('{{API_URL}}/users')).toBeInTheDocument()
        expect(screen.getByText('Send')).toBeInTheDocument()
    })

    it('updates request name on change', () => {
        render(<RequestEditor project={mockProject} request={mockRequest} />)

        const nameInput = screen.getByDisplayValue('Get Users')
        fireEvent.change(nameInput, { target: { value: 'New Name' } })

        expect(screen.getByDisplayValue('New Name')).toBeInTheDocument()
    })

    it('sends request when Send button is clicked', async () => {
        const mockResponse = {
            status: 200,
            statusText: 'OK',
            data: { users: [] },
            headers: {},
            duration: 100,
        }

        vi.mocked(httpClient.run).mockResolvedValue(mockResponse)

        render(<RequestEditor project={mockProject} request={mockRequest} />)

        fireEvent.click(screen.getByText('Send'))

        expect(screen.getByText('Sending...')).toBeInTheDocument()

        await waitFor(() => {
            expect(httpClient.run).toHaveBeenCalled()
        })

        // Check if variable substitution happened in the call
        expect(httpClient.run).toHaveBeenCalledWith(expect.objectContaining({
            url: 'http://localhost:3000/users'
        }))
    })
})
