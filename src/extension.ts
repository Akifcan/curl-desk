import * as vscode from 'vscode';
import { CurlDeskPanel } from './panels/CurlDeskPanel';
import { SidebarProvider } from './providers/SidebarProvider';
import { parseApiCall } from './utils/apiCallParser';

export function activate(context: vscode.ExtensionContext) {
  // Register sidebar
  const sidebarProvider = new SidebarProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.viewId, sidebarProvider)
  );

  // Register open command
  context.subscriptions.push(
    vscode.commands.registerCommand('curl-desk.open', () => {
      CurlDeskPanel.createOrShow(context);
    })
  );

  // Register "use selection as request body / parse API call" command
  context.subscriptions.push(
    vscode.commands.registerCommand('curl-desk.sendSelection', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.selection.isEmpty) {
        vscode.window.showInformationMessage('Curl Desk: No text selected.');
        return;
      }

      const text = editor.document.getText(editor.selection);
      const wasOpen = !!CurlDeskPanel.currentPanel;
      CurlDeskPanel.createOrShow(context);

      const parsed = parseApiCall(text);

      if (parsed) {
        // Extracted a full API call → open new tab with method + url + body
        setTimeout(() => {
          CurlDeskPanel.currentPanel?.loadParsedRequest(parsed);
        }, wasOpen ? 0 : 300);

        const parts = [parsed.method, parsed.url];
        vscode.window.showInformationMessage(
          `Curl Desk: Loaded ${parts.join(' ')} from selection.`
        );
      } else {
        // No recognised call pattern → just load as body text
        let bodyType = 'text';
        try { JSON.parse(text); bodyType = 'json'; } catch {}

        setTimeout(() => {
          CurlDeskPanel.currentPanel?.setBody(text, bodyType);
        }, wasOpen ? 0 : 300);

        vscode.window.showInformationMessage(
          `Curl Desk: Selection loaded as ${bodyType.toUpperCase()} body.`
        );
      }
    })
  );
}

export function deactivate() {}
