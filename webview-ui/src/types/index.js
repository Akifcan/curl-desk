export function generateId() {
    return Math.random().toString(36).substring(2, 11);
}
export function createKeyValue() {
    return { id: generateId(), key: '', value: '', enabled: true };
}
export function createFormField() {
    return { id: generateId(), key: '', value: '', type: 'text', enabled: true };
}
export function createEnvVariable() {
    return { id: generateId(), key: '', value: '' };
}
export function createAppTab(request) {
    return {
        id: generateId(),
        request: request ?? createDefaultRequest(),
        response: null,
        error: null,
        isLoading: false,
    };
}
export function createDefaultRequest() {
    return {
        id: generateId(),
        name: 'New Request',
        method: 'GET',
        url: '',
        params: [createKeyValue()],
        headers: [createKeyValue()],
        body: '{\n  \n}',
        bodyType: 'none',
        formFields: [createFormField()],
        auth: { type: 'none', token: '', username: '', password: '' },
    };
}
export const METHOD_COLORS = {
    GET: '#61afef',
    POST: '#98c379',
    PUT: '#e5c07b',
    DELETE: '#e06c75',
    PATCH: '#c678dd',
    HEAD: '#56b6c2',
    OPTIONS: '#abb2bf',
};
