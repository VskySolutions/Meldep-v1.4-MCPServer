// @ts-nocheck

export function mapEmployeeReport(
    employeeId,
    activitiesResponse
) {
    const projects =
        activitiesResponse?.data || [];

    const employeeReport = {
        empId: employeeId,
        employeeName: '',

        AssignedTasksCount: {},

        AssignedHrs: {},

        TotalActualHrs: 0,
    };

    const taskCount = {
        New: 0,
        InProgress: 0,
        Open: 0,
    };

    const assignedHrs = {
        New: 0,
        InProgress: 0,
        Open: 0,
    };

    for (const projectItem of projects) {
        const activities =
            projectItem?.activities || [];

        for (const activity of activities) {
            if (
                activity?.assignedToId !== employeeId
            ) {
                continue;
            }

            employeeReport.employeeName =
                activity?.assignedTo?.person
                    ?.fullName || '';

            const activityStatus =
                (
                    activity?.activityStatus
                        ?.dropDownValue || ''
                )
                    .replace(/\s+/g, '')
                    .toLowerCase();

            const projectStatus =
                (
                    activity?.project
                        ?.projectStatus
                        ?.dropDownValue || ''
                )
                    .replace(/\s+/g, '')
                    .toLowerCase();

            const hours = Number(
                activity?.estimateHours || 0
            );

            console.error(
                'Activity Debug',
                {
                    taskName:
                        activity?.task?.name,
                    activityStatus:
                        activity?.activityStatus
                            ?.dropDownValue,
                    projectStatus:
                        activity?.project
                            ?.projectStatus
                            ?.dropDownValue,
                    hours,
                }
            );

            switch (activityStatus) {
                case 'new':
                    taskCount.New += 1;
                    assignedHrs.New += hours;
                    break;

                case 'open':
                    taskCount.Open += 1;
                    assignedHrs.Open += hours;
                    break;
            }

            if (
                projectStatus === 'inprogress'
            ) {
                taskCount.InProgress += 1;
                assignedHrs.InProgress += hours;
            }
        }
    }

    if (taskCount.New > 0) {
        employeeReport.AssignedTasksCount.New =
            taskCount.New;

        employeeReport.AssignedHrs.New =
            assignedHrs.New;
    }

    if (taskCount.InProgress > 0) {
        employeeReport.AssignedTasksCount.InProgress =
            taskCount.InProgress;

        employeeReport.AssignedHrs.InProgress =
            assignedHrs.InProgress;
    }

    if (taskCount.Open > 0) {
        employeeReport.AssignedTasksCount.Open =
            taskCount.Open;

        employeeReport.AssignedHrs.Open =
            assignedHrs.Open;
    }

    employeeReport.TotalActualHrs =
        Object.values(
            employeeReport.AssignedHrs
        ).reduce(
            (sum, hrs) =>
                sum + Number(hrs || 0),
            0
        );

    return [employeeReport];
}