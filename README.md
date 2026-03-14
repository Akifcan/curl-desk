# Curl Desk

A full-featured HTTP client for Visual Studio Code. Build, send, and inspect API requests without leaving your editor.

## Features

- **Request Builder** — GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS with full control over headers, query params, body (JSON, text, form-data), and auth (Bearer, Basic)
- **Collections** — Organize requests into collections. Create, rename, delete, and reorder
- **Response Examples** — Save responses as named examples on any request. Load, rename, or delete them anytime
- **Multi-Tab Workspace** — Work on multiple requests simultaneously with a tabbed interface
- **Rich Response Viewer** — Syntax-highlighted JSON/HTML/XML with line numbers, Pretty/Raw toggle
- **Media Preview** — Renders images, video, and audio responses inline. Opens PDFs in VS Code's native viewer
- **HTML Preview** — Toggle between source code and rendered HTML preview for HTML responses
- **Environment Variables** — Define variables and use `{{variable}}` syntax in URLs, headers, and body
- **Sidebar** — Quick access to collections, requests, and history from the activity bar
- **Keyboard Shortcut** — Open with `Cmd+Shift+H` (Mac) or `Ctrl+Shift+H` (Windows/Linux)

## Getting Started

1. Install the extension from the VS Code Marketplace
2. Click the Curl Desk icon in the activity bar, or press `Cmd+Shift+H`
3. Enter a URL, pick a method, and hit Send

## Usage

### Sending Requests

Type a URL in the request bar, select an HTTP method, and click **Send**. Add headers, query parameters, request body, or authentication from the tabs below.

### Collections

Click **New Collection** in the sidebar to create one. Use **Save current here** inside any collection to save the active request. Requests and collections can be renamed (double-click or pencil icon) and deleted.

### Response Examples

After receiving a response, click **Save as Example** in the response panel to save it. Examples appear under their request in the sidebar. Click an example to load the full request and response.

### Environment Variables

Define variables in the environment panel and reference them with `{{variableName}}` in URLs, headers, or body fields. Variables are replaced at send time.

### Media Responses

The response viewer automatically detects content types:
- **Images** (PNG, JPEG, GIF, SVG, WebP) — rendered inline
- **Video** (MP4, WebM) — playable video player
- **Audio** (MP3, WAV, OGG) — audio player
- **PDF** — opens in VS Code's native viewer
- **HTML** — toggle between source and rendered preview

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| `Curl Desk: Open` | `Cmd+Shift+H` / `Ctrl+Shift+H` | Open the main panel |
| `Curl Desk: Use as Request Body` | — | Send selected text as request body |

## Requirements

- VS Code 1.85.0 or later

## License

[MIT](LICENSE)
