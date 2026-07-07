// @ts-nocheck

function normalizeValue(value) {
    return String(value || '').trim().toLowerCase();
}

export function mapProjectListResponse(rawResponse, filters = {}) {
    if (!rawResponse || !Array.isArray(rawResponse.data)) {
        return [];
    }

    const projectMap = new Map();

    rawResponse.data.forEach((project) => {
        if (!project?.id || !project?.name) {
            return;
        }

        const projectStatus =
            project?.projectStatus?.dropDownValue || '';

        const projectPriority =
            project?.projectPriority?.dropDownValue || '';

        const projectActive =
            project?.active ?? false;

        // Status Filter
        if (
            filters.status &&
            normalizeValue(projectStatus) !==
                normalizeValue(filters.status)
        ) {
            return;
        }

        // Priority Filter
        if (
            filters.priority &&
            normalizeValue(projectPriority) !==
                normalizeValue(filters.priority)
        ) {
            return;
        }

        // Search Filter
        if (
            filters.searchText &&
            !normalizeValue(project.name).includes(
                normalizeValue(filters.searchText)
            )
        ) {
            return;
        }

        // Active / Inactive Filter
        if (
            filters.activeStatus &&
            filters.activeStatus !== 'All'
        ) {
            const requiredActive =
                filters.activeStatus === 'Active';

            if (projectActive !== requiredActive) {
                return;
            }
        }

        if (!projectMap.has(project.id)) {
            projectMap.set(project.id, {
                projectName: project.name,
            });
        }
    });

    return Array.from(projectMap.values()).sort((a, b) =>
        a.projectName.localeCompare(b.projectName)
    );
}