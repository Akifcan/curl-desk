export function generateId() {
    return Math.random().toString(36).substring(2, 11);
}
export function createKeyValue() {
    return { id: generateId(), key: '', value: '', enabled: true };
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
