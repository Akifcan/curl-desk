interface VsCodeApi {
  postMessage: (message: unknown) => void;
  getState: <T>() => T | undefined;
  setState: <T>(state: T) => void;
}

declare function acquireVsCodeApi(): VsCodeApi;

const isVsCode = typeof acquireVsCodeApi !== 'undefined';

export const vscode: VsCodeApi = isVsCode
  ? acquireVsCodeApi()
  : {
      postMessage: (msg) => console.log('[Dev] postMessage:', msg),
      getState: () => undefined,
      setState: (state) => console.log('[Dev] setState:', state),
    };
