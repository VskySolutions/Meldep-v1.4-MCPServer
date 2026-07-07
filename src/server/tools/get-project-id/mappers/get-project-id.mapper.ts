// @ts-nocheck

export function mapProjectListResponse(rawResponse) {
    const list = Array.isArray(rawResponse)
        ? rawResponse
        : Array.isArray(rawResponse?.data)
            ? rawResponse.data
            : [];

    return list.map((item) => ({
        projectId: item.id ?? item.projectId ?? item.value ?? null,
        projectName: item.name ?? item.projectName ?? item.text ?? '',
        // customerName: item.customer?.name ?? item.customerName ?? undefined,
        isDisabled: item.disable ?? item.isDisabled ?? undefined,
    }));
}
