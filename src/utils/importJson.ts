import { projectsStore } from '../stores/projectsStore';
import { Project } from '../stores/db';

export const importProjects = async () => {
    const result = await window.api.loadProjects();

    if (result.success && result.data) {
        const projects = result.data as Project[];
        // Basic validation
        if (Array.isArray(projects)) {
            await projectsStore.importProjects(projects);
            return true;
        }
    }
    return false;
};
