import { projectsStore } from '../stores/projectsStore';

export const exportProjects = async () => {
    const projects = await projectsStore.getAll();
    const result = await window.api.saveProjects(projects);
    if (result.success) {
        console.log('Projects exported successfully to', result.filePath);
        return true;
    }
    return false;
};
