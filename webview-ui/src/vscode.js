const isVsCode = typeof acquireVsCodeApi !== 'undefined';
export const vscode = isVsCode
    ? acquireVsCodeApi()
    : {
        postMessage: (msg) => console.log('[Dev] postMessage:', msg),
        getState: () => undefined,
        setState: (state) => console.log('[Dev] setState:', state),
    };
