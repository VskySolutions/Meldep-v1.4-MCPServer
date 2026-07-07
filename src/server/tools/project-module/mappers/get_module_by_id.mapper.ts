// @ts-nocheck

export function mapModuleByIdResponse(
    rawResponse,
    moduleId
) {
    const requirements =
        rawResponse?.data?.filter(
            (item) =>
                item?.projectModuleId === moduleId
        ) || [];

    if (!requirements.length) {
        return {
            moduleId,
            moduleName: 'Not Found',

            summary: {
                totalRequirements: 0,
                totalTasks: 0,
            },

            status: {
                openTasks: 0,
                inDevelopmentTasks: 0,
                newTasks: 0,
                completedTasks: 0,
            },
        };
    }

    const moduleName =
        requirements?.[0]?.projectModule?.name ||
        'Not Available';

    let totalTasks = 0;
    let openTasks = 0;
    let inDevelopmentTasks = 0;
    let newTasks = 0;
    let completedTasks = 0;

    requirements.forEach((req) => {
        const tasks =
            req?.projectTaskRelatedMappings || [];

        totalTasks += tasks.length;

        tasks.forEach((taskMapping) => {
            const status =
                taskMapping?.projectTask?.status
                    ?.dropDownValue || '';

            switch (status) {
                case 'Open':
                    openTasks++;
                    break;

                case 'In Development':
                    inDevelopmentTasks++;
                    break;

                case 'New':
                    newTasks++;
                    break;

                case 'Completed':
                    completedTasks++;
                    break;
            }
        });
    });

    return {
        moduleId,

        moduleName,

        summary: {
            totalRequirements:
                requirements.length,

            totalTasks,
        },

        status: {
            openTasks,
            inDevelopmentTasks,
            newTasks,
            completedTasks,
        },
    };
}