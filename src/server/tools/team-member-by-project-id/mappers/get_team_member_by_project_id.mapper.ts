// @ts-nocheck

export function mapProjectTeamMembersResponse(rawProject) {

    if (
        !rawProject ||
        !Array.isArray(rawProject.projectEmployeeMappings)
    ) {
        return [];
    }

    return rawProject.projectEmployeeMappings.map((member) => ({
        employeeId:
            member?.employee?.id ||
            'Not Available',

        employeeName:
            member?.employee?.person?.fullName ||
            'Not Available',

        role:
            member?.employeeRoleDropdown?.dropDownValue ||
            'Not Assigned',
            
    }));
}