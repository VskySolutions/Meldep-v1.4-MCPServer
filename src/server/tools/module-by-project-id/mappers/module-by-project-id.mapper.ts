// @ts-nocheck

export function mapModulesByProjectIdResponse(rawResponse) {
    if (!rawResponse || !Array.isArray(rawResponse)) return [];

    return rawResponse.map((item) => ({
        moduleId: item.value,
        moduleName: item.text,
        isDisabled: item.disable,
    }));
}
