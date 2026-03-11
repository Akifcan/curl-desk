import * as vscode from 'vscode';
import { executeRequest } from '../utils/httpClient';
import { parseEnvFile } from '../utils/envParser';

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export class CurlDeskPanel {
  public static currentPanel: CurlDeskPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(context: vscode.ExtensionContext) {
    const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;

    if (CurlDeskPanel.currentPanel) {
      CurlDeskPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'curlDesk',
      'Curl Desk',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview'),
        ],
      }
    );

    CurlDeskPanel.currentPanel = new CurlDeskPanel(panel, context);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private readonly context: vscode.ExtensionContext
  ) {
    this._panel = panel;

    this._panel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.png');
    this._update();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.onDidChangeViewState(() => {
      if (this._panel.visible) this._update();
    }, null, this._disposables);

    this._setWebviewMessageListener(this._panel.webview);
  }

  private _update() {
    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview', 'main.js')
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
  <title>Curl Desk</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case 'SEND_REQUEST': {
            try {
              const response = await executeRequest(message.payload);
              webview.postMessage({ type: 'REQUEST_RESPONSE', source: message.source, tabId: message.tabId, payload: response });
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Request failed';
              webview.postMessage({ type: 'REQUEST_ERROR', source: message.source, tabId: message.tabId, payload: { message: msg } });
            }
            break;
          }
          case 'SAVE_COLLECTIONS': {
            await this.context.globalState.update('curl-desk:collections', message.payload);
            break;
          }
          case 'GET_COLLECTIONS': {
            const collections = this.context.globalState.get('curl-desk:collections', []);
            webview.postMessage({ type: 'COLLECTIONS_LOADED', payload: collections });
            break;
          }
          case 'GET_ENVIRONMENTS': {
            const environments = this.context.globalState.get('curl-desk:environments', []);
            const activeEnvId = this.context.globalState.get('curl-desk:activeEnvId', null);
            webview.postMessage({ type: 'ENVIRONMENTS_LOADED', payload: { environments, activeEnvId } });
            break;
          }
          case 'SAVE_ENVIRONMENTS': {
            const { environments, activeEnvId } = message.payload as { environments: unknown[]; activeEnvId: string | null };
            await this.context.globalState.update('curl-desk:environments', environments);
            await this.context.globalState.update('curl-desk:activeEnvId', activeEnvId);
            break;
          }
          case 'SCAN_ENV_FILES': {
            if (!vscode.workspace.workspaceFolders?.length) {
              webview.postMessage({ type: 'ENV_FILES_FOUND', payload: [] });
              break;
            }
            const files = await vscode.workspace.findFiles('**/.env*', '**/node_modules/**', 30);
            const result = files.map(f => ({
              path: f.fsPath,
              name: vscode.workspace.asRelativePath(f),
            }));
            webview.postMessage({ type: 'ENV_FILES_FOUND', payload: result });
            break;
          }
          case 'READ_ENV_FILE': {
            const { path: filePath, fileName } = message.payload as { path: string; fileName: string };
            const uri = vscode.Uri.file(filePath);
            const bytes = await vscode.workspace.fs.readFile(uri);
            const content = Buffer.from(bytes).toString('utf8');
            const variables = parseEnvFile(content);
            webview.postMessage({ type: 'ENV_FILE_CONTENT', payload: { variables, fileName } });
            break;
          }
        }
      },
      undefined,
      this._disposables
    );
  }

  /** Load a specific request into the webview (called from sidebar) */
  public loadRequest(request: unknown) {
    this._panel.webview.postMessage({ type: 'LOAD_REQUEST', payload: request });
  }

  /** Set the body of the currently active tab (called from sendSelection command) */
  public setBody(body: string, bodyType: string) {
    this._panel.webview.postMessage({ type: 'LOAD_BODY', payload: { body, bodyType } });
  }

  /** Open a new tab pre-filled from a parsed API call (method + url + optional body) */
  public loadParsedRequest(parsed: { method: string; url: string; body?: string }) {
    this._panel.webview.postMessage({ type: 'LOAD_PARSED_REQUEST', payload: parsed });
  }

  public dispose() {
    CurlDeskPanel.currentPanel = undefined;
    this._panel.dispose();
    this._disposables.forEach((d) => d.dispose());
    this._disposables = [];
  }
}
