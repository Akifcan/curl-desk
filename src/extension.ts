import * as vscode from 'vscode';
import { CurlDeskPanel } from './panels/CurlDeskPanel';
import { SidebarProvider } from './providers/SidebarProvider';

export function activate(context: vscode.ExtensionContext) {
  // Register sidebar
  const sidebarProvider = new SidebarProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SidebarProvider.viewId, sidebarProvider)
  );

  // Register open command
  const openCommand = vscode.commands.registerCommand('curl-desk.open', () => {
    CurlDeskPanel.createOrShow(context);
  });

  context.subscriptions.push(openCommand);
}

export function deactivate() {}
