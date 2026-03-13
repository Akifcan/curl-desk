import * as vscode from "vscode";
import { CurlDeskPanel } from "../panels/CurlDeskPanel";
import { executeRequest } from "../utils/httpClient";
import { sidebarStyles } from "./sidebar/styles";
import { sidebarHtml } from "./sidebar/html";
import { sidebarScript } from "./sidebar/script";

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = "curl-desk.sidebar";
  private _view?: vscode.WebviewView;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.html = this._getHtml();

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case "GET_COLLECTIONS": {
          const collections = this.context.globalState.get(
            "curl-desk:collections",
            [],
          );
          const history = this.context.globalState.get("curl-desk:history", []);
          webviewView.webview.postMessage({
            type: "COLLECTIONS_LOADED",
            payload: collections,
          });
          webviewView.webview.postMessage({
            type: "HISTORY_LOADED",
            payload: history,
          });
          break;
        }
        case "OPEN_PANEL": {
          CurlDeskPanel.createOrShow(this.context, () => this.refresh());
          // Pass selected request to main panel if provided
          if (message.payload) {
            setTimeout(() => {
              CurlDeskPanel.currentPanel?.loadRequest(message.payload);
            }, 300);
          }
          break;
        }
        case "DELETE_COLLECTION": {
          const collections: unknown[] = this.context.globalState.get(
            "curl-desk:collections",
            [],
          );
          const updated = (collections as Array<{ id: string }>).filter(
            (c) => c.id !== message.payload,
          );
          await this.context.globalState.update(
            "curl-desk:collections",
            updated,
          );
          webviewView.webview.postMessage({
            type: "COLLECTIONS_LOADED",
            payload: updated,
          });
          CurlDeskPanel.currentPanel?.refreshCollections();
          break;
        }
        case "GET_ENVIRONMENTS": {
          const environments = this.context.globalState.get("curl-desk:environments", []);
          const activeEnvId = this.context.globalState.get("curl-desk:activeEnvId", null);
          webviewView.webview.postMessage({ type: "ENVIRONMENTS_LOADED", payload: { environments, activeEnvId } });
          break;
        }
        case "SEND_REQUEST": {
          try {
            const response = await executeRequest(message.payload);
            const historyItem = {
              id: Date.now().toString(36),
              method: message.payload.method,
              url: message.payload.url,
              timestamp: Date.now(),
            };
            const history: unknown[] = this.context.globalState.get(
              "curl-desk:history",
              [],
            );
            const updatedHistory = [historyItem, ...history].slice(0, 100);
            await this.context.globalState.update(
              "curl-desk:history",
              updatedHistory,
            );
            webviewView.webview.postMessage({
              type: "REQUEST_RESPONSE",
              payload: response,
            });
            webviewView.webview.postMessage({
              type: "HISTORY_LOADED",
              payload: updatedHistory,
            });
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Request failed";
            webviewView.webview.postMessage({
              type: "REQUEST_ERROR",
              payload: { message: msg },
            });
          }
          break;
        }
        case "DELETE_HISTORY_ITEM": {
          const historyList: unknown[] = this.context.globalState.get("curl-desk:history", []);
          const updatedHist = (historyList as Array<{ id: string }>).filter(
            (h) => h.id !== message.payload,
          );
          await this.context.globalState.update("curl-desk:history", updatedHist);
          webviewView.webview.postMessage({ type: "HISTORY_LOADED", payload: updatedHist });
          break;
        }
        case "RENAME_COLLECTION": {
          const { id, name } = message.payload as { id: string; name: string };
          const cols: unknown[] = this.context.globalState.get(
            "curl-desk:collections",
            [],
          );
          const updated = (
            cols as Array<{ id: string; name: string }>
          ).map((c) => (c.id === id ? { ...c, name } : c));
          await this.context.globalState.update(
            "curl-desk:collections",
            updated,
          );
          webviewView.webview.postMessage({
            type: "COLLECTIONS_LOADED",
            payload: updated,
          });
          CurlDeskPanel.currentPanel?.refreshCollections();
          break;
        }
        case "RENAME_REQUEST": {
          const { collectionId, requestId, name } = message.payload as {
            collectionId: string;
            requestId: string;
            name: string;
          };
          const renCols: unknown[] = this.context.globalState.get(
            "curl-desk:collections",
            [],
          );
          const renUpdated = (
            renCols as Array<{ id: string; requests: Array<{ id: string; name: string }> }>
          ).map((c) =>
            c.id === collectionId
              ? { ...c, requests: c.requests.map((r) => r.id === requestId ? { ...r, name } : r) }
              : c,
          );
          await this.context.globalState.update(
            "curl-desk:collections",
            renUpdated,
          );
          webviewView.webview.postMessage({
            type: "COLLECTIONS_LOADED",
            payload: renUpdated,
          });
          CurlDeskPanel.currentPanel?.refreshCollections();
          break;
        }
        case "DELETE_REQUEST": {
          const { collectionId, requestId } = message.payload as {
            collectionId: string;
            requestId: string;
          };
          const cols: unknown[] = this.context.globalState.get(
            "curl-desk:collections",
            [],
          );
          const updated = (
            cols as Array<{ id: string; requests: Array<{ id: string }> }>
          ).map((c) =>
            c.id === collectionId
              ? { ...c, requests: c.requests.filter((r) => r.id !== requestId) }
              : c,
          );
          await this.context.globalState.update(
            "curl-desk:collections",
            updated,
          );
          webviewView.webview.postMessage({
            type: "COLLECTIONS_LOADED",
            payload: updated,
          });
          CurlDeskPanel.currentPanel?.refreshCollections();
          break;
        }
      }
    });

    // Refresh when panel becomes visible
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        const collections = this.context.globalState.get(
          "curl-desk:collections",
          [],
        );
        const history = this.context.globalState.get("curl-desk:history", []);
        const environments = this.context.globalState.get("curl-desk:environments", []);
        const activeEnvId = this.context.globalState.get("curl-desk:activeEnvId", null);
        webviewView.webview.postMessage({
          type: "COLLECTIONS_LOADED",
          payload: collections,
        });
        webviewView.webview.postMessage({
          type: "HISTORY_LOADED",
          payload: history,
        });
        webviewView.webview.postMessage({
          type: "ENVIRONMENTS_LOADED",
          payload: { environments, activeEnvId },
        });
      }
    });
  }

  /** Called by main panel when collections change, to keep sidebar in sync */
  public refresh() {
    if (this._view?.visible) {
      const collections = this.context.globalState.get(
        "curl-desk:collections",
        [],
      );
      this._view.webview.postMessage({
        type: "COLLECTIONS_LOADED",
        payload: collections,
      });
    }
  }

  private _getHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; media-src data: blob:; frame-src blob: data:;">
<style>${sidebarStyles()}</style>
</head>
<body>
${sidebarHtml()}
<script>${sidebarScript()}</script>
</body>
</html>`;
  }
}
